import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import StudentDashboardSidebar from "@/features/student/components/StudentDashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { mentors, Message, Person } from "@/utils/people";
import { useParams, useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import { StoredAccount, getDisplayNameForAccount } from "@/utils/auth";
import { Badge } from "@/components/ui/badge";
import {
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
	useNotifications,
} from "@/hooks/useNotifications";
import { useCurrentAccount } from "@/hooks/useCurrentAccount";
import {
	CONVERSATION_STORE_KEY,
	ConversationStore,
	appendConversationMessage,
	getConversationKey,
	mapMessagesForViewer,
	getLastActivityTimestamp,
	formatLastActivity,
	buildAccountThreadId,
	CONVERSATION_REQUESTS_KEY,
	ConversationRequestStore,
	getConversationRequest,
	upsertConversationRequest,
	removeConversationRequest,
	normalizeEmail,
} from "@/utils/messaging";

function formatWhen(ts: number | string) {
	const d = new Date(ts);
	const now = new Date();
	const sameDay =
		d.getFullYear() === now.getFullYear() &&
		d.getMonth() === now.getMonth() &&
		d.getDate() === now.getDate();
	return sameDay
		? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
		: d.toLocaleDateString();
}

function cloneMentorThreads(matchedIds?: Set<number>): Person[] {
	return mentors.map((mentor) => ({
		...mentor,
		matchedWithUser: matchedIds ? matchedIds.has(mentor.id) : false,
		conversation: mentor.conversation.map((message) => ({ ...message })),
	}));
}

function StudentMessagingLayout() {
	const navigate = useNavigate();
	const { account, currentEmail } = useCurrentAccount();
	const profileMatches = account?.profile?.matchedMentorIds;
	const matchedMentorIds = React.useMemo(() => {
		const matches = profileMatches ?? [];
		return new Set(matches.slice(0, 4).map((match) => match.mentor.id));
	}, [profileMatches]);
	const hasCompletedOnboarding = account?.wentThroughOnboarding === true;
	const shouldRedirectOnboarding = React.useMemo(
		() =>
			Boolean(
				currentEmail &&
					account &&
					account.role === "student" &&
					account.wentThroughOnboarding !== true
			),
		[account, currentEmail]
	);
	const shouldRedirectHome = React.useMemo(
		() => !currentEmail || !account || account.role !== "student",
		[account, currentEmail]
	);
	const isAuthorized = React.useMemo(
		() =>
			Boolean(
				currentEmail && account && account.role === "student" && hasCompletedOnboarding
			),
		[account, currentEmail, hasCompletedOnboarding]
	);

	const storageIdentity = currentEmail ?? "anonymous-student";
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:studentMessages`,
		[storageIdentity]
	);

	const [localThreads, setLocalThreads] = useStoredState<Person[]>(
		`${storagePrefix}:threads`,
		() => cloneMentorThreads(matchedMentorIds)
	);
	const [conversationStore, setConversationStore] = useStoredState<ConversationStore>(
		CONVERSATION_STORE_KEY,
		() => ({} as ConversationStore)
	);
	const [allAccounts] = useStoredState<StoredAccount[]>("auth:accounts", () => []);
	const [selectedId, setSelectedId] = useStoredState<number | null>(
		`${storagePrefix}:selectedId`,
		null
	);
	const [composer, setComposer] = useStoredState<string>(`${storagePrefix}:composer`, "");
	const [search, setSearch] = useStoredState<string>(`${storagePrefix}:search`, "");

	const [showAllRequested, setShowAllRequested] = useStoredState<boolean>(
		`${storagePrefix}:showAllRequested`,
		false
	);
	const [showAllMatched, setShowAllMatched] = useStoredState<boolean>(
		`${storagePrefix}:showAllMatched`,
		false
	);
	const [showAllConnected, setShowAllConnected] = useStoredState<boolean>(
		`${storagePrefix}:showAllConnected`,
		false
	);
	const [conversationRequests, setConversationRequests] =
		useStoredState<ConversationRequestStore>(
			CONVERSATION_REQUESTS_KEY,
			() => ({} as ConversationRequestStore)
		);
	const ROW_LIMIT = 6;
	const studentDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "A student",
		[]
	);
	const { addNotification: addStudentNotification } = useNotifications("student");

	const { id: routeId } = useParams<{ id?: string }>();

	const mentorAccounts = React.useMemo(
		() =>
			allAccounts.filter(
				(account) => account.role === "mentor" && account.email !== currentEmail
			),
		[currentEmail, allAccounts]
	);

	const dynamicMentorThreads = React.useMemo(() => {
		if (!currentEmail) {
			return [] as Person[];
		}

		return mentorAccounts.map((mentorAccount) => {
			const key = getConversationKey(currentEmail, mentorAccount.email);
			const thread = conversationStore[key];
			const conversation = mapMessagesForViewer(thread, currentEmail);
			const lastActivity = getLastActivityTimestamp(thread);
			const hasConnected = conversation.length > 0;
			const name = getDisplayNameForAccount(mentorAccount) ?? mentorAccount.email;
			return {
				id: buildAccountThreadId(mentorAccount.email, "mentor"),
				name,
				type: mentorAccount.profile?.mentorType === "teacher" ? "teacher" : "peer",
				matchedWithUser: false,
				hasConnected,
				requestedCommunication: false,
				bio:
					mentorAccount.profile?.mentorBio?.trim() ||
					mentorAccount.profile?.bio?.trim() ||
					`${name} is available to connect.`,
				profilePicture: placeholderProfile,
				email: mentorAccount.email,
				conversation,
				lastMessage: formatLastActivity(lastActivity),
				lastMessageUnix: lastActivity,
			} as Person;
		});
	}, [conversationStore, mentorAccounts, currentEmail]);

	const threads = React.useMemo(() => {
		const map = new Map<number, Person>();
		dynamicMentorThreads.forEach((thread) => {
			map.set(thread.id, thread);
		});
		localThreads.forEach((thread) => {
			if (!map.has(thread.id)) {
				map.set(thread.id, thread);
			}
		});
		const decorated = [...map.values()].map((thread) => {
			if (currentEmail && thread.email) {
				const request = getConversationRequest(
					conversationRequests,
					currentEmail,
					thread.email
				);
				if (
					request?.direction === "student_to_mentor" &&
					request.initiator === normalizeEmail(currentEmail) &&
					!thread.hasConnected
				) {
					return { ...thread, requestedCommunication: true };
				}
			}
			return thread;
		});
		return decorated.sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
	}, [dynamicMentorThreads, localThreads, conversationRequests, currentEmail]);

	React.useEffect(() => {
		setLocalThreads((prev) =>
			prev.map((thread) => {
				const nextMatched = matchedMentorIds.has(thread.id);
				if (nextMatched) {
					return thread;
				}
				return { ...thread, matchedWithUser: nextMatched };
			})
		);
	}, [matchedMentorIds, setLocalThreads]);

	React.useEffect(() => {
		if (shouldRedirectOnboarding) {
			navigate("/onboarding/", { replace: true });
			return;
		}

		if (!isAuthorized || shouldRedirectHome) {
			navigate("/", { replace: true });
		}
	}, [isAuthorized, navigate, shouldRedirectHome, shouldRedirectOnboarding]);

	React.useEffect(() => {
		if (routeId) {
			const parsed = Number(routeId);
			if (!Number.isNaN(parsed)) {
				setSelectedId(parsed);
				return;
			}
		}
		setSelectedId((prev) => (prev == null && threads.length ? threads[0].id : prev));
	}, [routeId, threads, setSelectedId]);

	React.useEffect(() => {
		if (selectedId != null && !threads.some((p) => p.id === selectedId)) {
			setSelectedId(threads[0]?.id ?? null);
		}
	}, [threads, selectedId, setSelectedId]);

	const selected = React.useMemo(
		() => (selectedId == null ? undefined : threads.find((p) => p.id === selectedId)),
		[threads, selectedId]
	);

	const endRef = React.useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [selectedId, selected?.conversation.length]);

	function openChat(personId: number) {
		setSelectedId(personId);
		navigate(`/student/home/messages/${personId}`);
	}

	function requestChat(person?: Person) {
		const target = person ?? selected;
		if (!target || target.hasConnected) {
			return;
		}

		if (!currentEmail || !target.email) {
			setLocalThreads((prevThreads) =>
				prevThreads.map((thread) =>
					thread.id === target.id ? { ...thread, requestedCommunication: true } : thread
				)
			);
			return;
		}

		const existingRequest = getConversationRequest(
			conversationRequests,
			currentEmail,
			target.email
		);
		if (existingRequest) {
			return;
		}

		setConversationRequests((prev) =>
			upsertConversationRequest(prev, {
				initiator: currentEmail,
				recipient: target.email!,
				direction: "student_to_mentor",
			})
		);
		setLocalThreads((prev) =>
			prev.map((thread) =>
				thread.id === target.id ? { ...thread, requestedCommunication: true } : thread
			)
		);

		addStudentNotification({
			message: `Chat request sent to ${target.name}.`,
			type: "request",
			contextId: target.id,
		});

		const mentorRouteId = buildAccountThreadId(currentEmail, "student");
		pushNotificationToOtherRole(
			"mentor",
			`${studentDisplayName} requested to connect with you.`,
			{
				type: "request",
				contextId: mentorRouteId ?? target.id,
				link: `/mentor/home/messages/${mentorRouteId ?? target.id}`,
				email: target.email,
			}
		);
	}

	function sendMessage() {
		const text = composer.trim();
		if (!text || selectedId == null || !selected) return;
		if (selected.requestedCommunication && !selected.hasConnected) {
			return;
		}

		const nowStr = new Date().toLocaleString();
		const nowUnix = Date.now();

		if (selected.email && currentEmail) {
			setConversationStore((prevStore) =>
				appendConversationMessage(prevStore, {
					from: currentEmail,
					to: selected.email!,
					text,
				})
			);
		} else {
			const next: Message = { id: Date.now(), from: "out", text };
			setLocalThreads((prevThreads) => {
				const updated = prevThreads.map((thread) => {
					if (thread.id !== selectedId) {
						return thread;
					}

					const updatedConversation = [...thread.conversation, next];

					return {
						...thread,
						hasConnected: true,
						requestedCommunication: false,
						conversation: updatedConversation,
						lastMessage: nowStr,
						lastMessageUnix: nowUnix,
					};
				});

				return [...updated].sort(
					(a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0)
				);
			});
		}

		if (selected.email && currentEmail) {
			setConversationRequests((prev) =>
				removeConversationRequest(prev, currentEmail, selected.email!)
			);
		}

		const mentorRouteId =
			selected.email && currentEmail
				? buildAccountThreadId(currentEmail, "student")
				: selectedId;

		pushNotificationToOtherRole("mentor", `${studentDisplayName} sent you a new message.`, {
			type: "message",
			contextId: mentorRouteId,
			link: `/mentor/home/messages/${mentorRouteId ?? selectedId}`,
			email: selected.email,
		});

		setComposer("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	const filtered: Person[] = React.useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return threads;
		return threads.filter(
			(p) =>
				p.name.toLowerCase().includes(q) ||
				p.bio.toLowerCase().includes(q) ||
				p.conversation.some((m) => m.text.toLowerCase().includes(q))
		);
	}, [threads, search]);

	const requested = filtered.filter((p) => p.requestedCommunication && !p.hasConnected);
	const matched = filtered.filter((p) => matchedMentorIds.has(p.id));
	const connected = filtered.filter(
		(p) => p.hasConnected && !p.requestedCommunication && !matchedMentorIds.has(p.id)
	);
	const outstandingRequestCount = React.useMemo(
		() => threads.filter((p) => p.requestedCommunication && !p.hasConnected).length,
		[threads]
	);
	const canRequestSelected = Boolean(
		selected && !selected.hasConnected && !selected.requestedCommunication
	);
	const isPendingSelected = selected?.requestedCommunication && !selected?.hasConnected;
	const pendingRequestLabel = outstandingRequestCount === 1 ? "request" : "requests";

	function ListGroup({
		title,
		items,
		showAll,
		onToggle,
		emptyLabel,
	}: {
		title: string;
		items: Person[];
		showAll: boolean;
		onToggle: () => void;
		emptyLabel: string;
	}) {
		const visible = showAll ? items : items.slice(0, ROW_LIMIT);

		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-muted-foreground">
						{title} ({items.length})
					</h4>
					{items.length > ROW_LIMIT && (
						<Button variant="ghost" size="sm" className="h-7 px-2" onClick={onToggle}>
							{showAll ? "Show Less" : "Show All"}
						</Button>
					)}
				</div>
				<ul className="divide-y">
					{visible.map((p) => (
						<li
							key={p.id}
							className="rounded-md focus-within:ring-1 focus-within:ring-ring">
							<div
								role="button"
								tabIndex={0}
								className={`w-full py-2 px-2 rounded-md flex items-start gap-3 text-left transition cursor-pointer ${
									p.id === selectedId ? "bg-muted" : "hover:bg-muted/60"
								}`}
								onClick={() => openChat(p.id)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										openChat(p.id);
									}
								}}>
								<img
									className="w-8 h-8 rounded-full flex-shrink-0"
									src={p.profilePicture}
									alt={`${p.name} avatar`}
								/>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium truncate">{p.name}</span>
										{p.lastMessageUnix && (
											<span className="text-[10px] text-muted-foreground shrink-0">
												{formatWhen(p.lastMessageUnix)}
											</span>
										)}
									</div>
									{p.requestedCommunication && !p.hasConnected && (
										<Badge
											className="mt-1 w-fit text-[10px]"
											variant="secondary">
											Requested
										</Badge>
									)}
								</div>
							</div>
						</li>
					))}
					{!items.length && (
						<li className="py-3 text-sm text-muted-foreground">{emptyLabel}</li>
					)}
				</ul>
			</div>
		);
	}

	if (!isAuthorized) {
		return null;
	}

	return (
		<SidebarProvider>
			<StudentDashboardSidebar activePage="messages" />
			<main className="flex-1 p-8 h-full">
				<div className="flex flex-col md:flex-row gap-6 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)]">
					<section className="flex-1 min-w-0 flex flex-col">
						<Card className="flex-1 flex flex-col">
							<CardHeader>
								<h3 className="flex text-lg font-semibold gap-3 items-center">
									<SidebarTrigger />
									{selected?.name ?? "Messages"}
								</h3>
							</CardHeader>

							<CardContent className="flex-1 flex flex-col p-0">
								{canRequestSelected && selected && (
									<div className="px-4 pt-4">
										<div className="rounded-md border border-dashed bg-muted/50 p-3 space-y-3 text-sm text-muted-foreground">
											<p>
												Request to chat with {selected.name}. We'll notify
												them so they can respond when they're available.
											</p>
											<Button size="sm" onClick={() => requestChat(selected)}>
												Request to chat
											</Button>
										</div>
									</div>
								)}
								{isPendingSelected && selected && (
									<div className="px-4 pt-4">
										<div className="rounded-md border border-dashed bg-muted/50 p-3 text-sm text-muted-foreground">
											Your request to chat with {selected.name} is pending.
											You'll be able to send messages as soon as they accept.
										</div>
									</div>
								)}
								<ScrollArea className="flex-1 p-4">
									<div className="space-y-3 flex flex-col">
										{selected?.conversation?.map((m) => (
											<div
												key={m.id}
												className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
													m.from === "in"
														? "bg-muted text-foreground self-start"
														: "bg-primary text-primary-foreground self-end ml-auto"
												}`}>
												{m.text}
											</div>
										))}
										<div ref={endRef} />
									</div>
								</ScrollArea>

								<div className="p-4 border-t bg-card mt-auto sticky bottom-0">
									<div className="flex gap-2">
										<textarea
											rows={1}
											className="flex-1 rounded-md border border-input p-2 resize-none"
											placeholder={
												selected?.name
													? isPendingSelected
														? `Waiting for ${selected.name} to accept`
														: canRequestSelected
														? `Request to chat with ${selected.name}`
														: `Chat with ${selected.name}`
													: "Start a conversation"
											}
											value={composer}
											onChange={(e) => setComposer(e.target.value)}
											onKeyDown={handleKeyDown}
											disabled={isPendingSelected || canRequestSelected}
										/>
										<Button
											onClick={sendMessage}
											disabled={
												isPendingSelected ||
												canRequestSelected ||
												!composer.trim()
											}>
											Send
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</section>

					<aside className="w-full md:w-[360px] max-h-[calc(100vh-4rem)]">
						<Card className="flex-1 flex flex-col">
							<CardHeader>
								<h3 className="text-lg font-semibold">People</h3>
							</CardHeader>
							<CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
								<div className="p-4 space-y-4">
									{outstandingRequestCount > 0 && (
										<div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
											You have {outstandingRequestCount} pending{" "}
											{pendingRequestLabel}. We'll let you know as soon as a
											mentor responds.
										</div>
									)}
									<Input
										placeholder="Search people & messages"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>

									<ScrollArea className="h-[calc(100vh-20rem)] pr-2">
										<div className="space-y-6">
											<ListGroup
												title="Pending Requests"
												items={requested}
												showAll={showAllRequested}
												onToggle={() => setShowAllRequested((v) => !v)}
												emptyLabel="No pending requests"
											/>

											<ListGroup
												title="Matched"
												items={matched}
												showAll={showAllMatched}
												onToggle={() => setShowAllMatched((v) => !v)}
												emptyLabel="No matches"
											/>

											<ListGroup
												title="Connected"
												items={connected}
												showAll={showAllConnected}
												onToggle={() => setShowAllConnected((v) => !v)}
												emptyLabel="No conversations yet"
											/>
										</div>
									</ScrollArea>
									<div className="pt-2">
										<Button className="w-full" asChild>
											<a
												href={`/student/home/messages/mentors-directory/${selectedId}`}>
												View All Mentors
											</a>
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</aside>
				</div>
			</main>
		</SidebarProvider>
	);
}

export default StudentMessagingLayout;
