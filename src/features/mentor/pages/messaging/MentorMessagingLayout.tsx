import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MentorDashboardSidebar from "@/features/mentor/components/MentorDashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { students, Message, Student } from "@/utils/people";
import { useParams, useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import {
	StoredAccount,
	findAccount,
	getCurrentEmail,
	getDisplayNameForAccount,
} from "@/utils/auth";
import {
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
} from "@/hooks/useNotifications";
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
	removeConversationRequest,
} from "@/utils/messaging";

function formatWhen(ts: number | string) {
	const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
	const now = new Date();
	const sameDay =
		d.getFullYear() === now.getFullYear() &&
		d.getMonth() === now.getMonth() &&
		d.getDate() === now.getDate();
	return sameDay
		? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
		: d.toLocaleDateString();
}

function cloneStudentThreads(): Student[] {
	return students.map((student) => ({
		...student,
		conversation: student.conversation.map((message) => ({ ...message })),
	}));
}

function MentorMessagingLayout() {
	const navigate = useNavigate();
	const currentEmail = React.useMemo(() => {
		const raw = getCurrentEmail();
		return raw ? raw : null;
	}, []);
	const account = React.useMemo(
		() => (currentEmail ? findAccount(currentEmail) ?? null : null),
		[currentEmail]
	);
	const hasCompletedOnboarding = account?.wentThroughOnboarding === true;
	const shouldRedirectOnboarding = React.useMemo(
		() =>
			Boolean(
				currentEmail &&
					account &&
					account.role === "mentor" &&
					account.wentThroughOnboarding !== true
			),
		[account, currentEmail]
	);
	const shouldRedirectHome = React.useMemo(
		() => !currentEmail || !account || account.role !== "mentor",
		[account, currentEmail]
	);
	const isAuthorized = React.useMemo(
		() =>
			Boolean(currentEmail && account && account.role === "mentor" && hasCompletedOnboarding),
		[account, currentEmail, hasCompletedOnboarding]
	);

	const storageIdentity = currentEmail ?? "anonymous-mentor";
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:mentorMessages`,
		[storageIdentity]
	);

	const [localThreads, setLocalThreads] = useStoredState<Student[]>(
		`${storagePrefix}:threads`,
		() => cloneStudentThreads()
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

	const [showAllPending, setShowAllPending] = useStoredState<boolean>(
		`${storagePrefix}:showAllPending`,
		false
	);
	const [showAllActive, setShowAllActive] = useStoredState<boolean>(
		`${storagePrefix}:showAllActive`,
		false
	);
	const [conversationRequests, setConversationRequests] =
		useStoredState<ConversationRequestStore>(
			CONVERSATION_REQUESTS_KEY,
			() => ({} as ConversationRequestStore)
		);
	const ROW_LIMIT = 6;
	const mentorDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "Your mentor",
		[]
	);

	const { id: routeId } = useParams<{ id?: string }>();

	const studentAccounts = React.useMemo(
		() =>
			allAccounts.filter(
				(account) => account.role === "student" && account.email !== currentEmail
			),
		[currentEmail, allAccounts]
	);

	const dynamicStudentThreads = React.useMemo(() => {
		if (!currentEmail) {
			return [] as Student[];
		}

		return studentAccounts.map((studentAccount) => {
			const key = getConversationKey(currentEmail, studentAccount.email);
			const thread = conversationStore[key];
			const conversation = mapMessagesForViewer(thread, currentEmail);
			const lastActivity = getLastActivityTimestamp(thread);
			const hasConnected = conversation.length > 0;
			const displayName = getDisplayNameForAccount(studentAccount) ?? studentAccount.email;
			const parsedGrade = Number.parseInt(studentAccount.profile?.grade ?? "", 10);
			const matchedMentors = studentAccount.profile?.matchedMentorIds ?? [];
			const isAssignedToCurrentMentor = Boolean(
				account && matchedMentors.some((match) => match.mentor.id === (account?.id ?? -1))
			);
			return {
				id: buildAccountThreadId(studentAccount.email, "student"),
				name: displayName,
				grade: Number.isNaN(parsedGrade) ? undefined : parsedGrade,
				assignedToMentor: isAssignedToCurrentMentor,

				hasConnected,
				requestedCommunication: false,
				bio:
					studentAccount.profile?.bio?.trim() ||
					`${displayName} recently joined My First Day.`,
				profilePicture: placeholderProfile,
				email: studentAccount.email,
				conversation,
				lastMessage: formatLastActivity(lastActivity),
				lastMessageUnix: lastActivity,
			} as Student;
		});
	}, [conversationStore, studentAccounts, currentEmail, account]);

	const threads = React.useMemo(() => {
		const merged = new Map<number, Student>();
		dynamicStudentThreads.forEach((thread) => {
			merged.set(thread.id, thread);
		});
		localThreads.forEach((thread) => {
			if (!merged.has(thread.id)) {
				merged.set(thread.id, thread);
			}
		});
		const decorated = [...merged.values()].map((thread) => {
			if (thread.email && currentEmail) {
				const request = getConversationRequest(
					conversationRequests,
					thread.email,
					currentEmail
				);
				if (request?.direction === "student_to_mentor" && !thread.hasConnected) {
					return { ...thread, requestedCommunication: true };
				}
			}
			return thread;
		});
		return decorated
			.filter((thread) => thread.hasConnected || thread.requestedCommunication)
			.sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
	}, [dynamicStudentThreads, localThreads, conversationRequests, currentEmail]);

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

	function openChat(studentId: number) {
		if (studentId !== selectedId) {
			setSelectedId(studentId);
			navigate(`/mentor/home/messages/${studentId}`, { replace: false });
		}
	}

	function sendMessage() {
		const text = composer.trim();
		if (!text || selectedId == null || !selected) return;

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
			setConversationRequests((prev) =>
				removeConversationRequest(prev, selected.email!, currentEmail)
			);
		} else {
			const next: Message = { id: Date.now(), from: "out", text };
			setLocalThreads((prevThreads) => {
				const updatedThreads = prevThreads.map((thread) => {
					if (thread.id !== selectedId) {
						return thread;
					}
					const updatedConversation = [...thread.conversation, next];
					return {
						...thread,
						hasConnected: true,
						assignedToMentor: true,
						conversation: updatedConversation,
						lastMessage: nowStr,
						lastMessageUnix: nowUnix,
					};
				});

				return [...updatedThreads].sort(
					(a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0)
				);
			});
		}

		const studentRouteId = currentEmail
			? buildAccountThreadId(currentEmail, "mentor")
			: selectedId;

		pushNotificationToOtherRole("student", `${mentorDisplayName} sent you a new message.`, {
			type: "message",
			contextId: studentRouteId,
			link: `/student/home/messages/${studentRouteId ?? selectedId}`,
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

	const filtered: Student[] = React.useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return threads;
		return threads.filter(
			(p) =>
				p.name.toLowerCase().includes(q) ||
				(p.bio ?? "").toLowerCase().includes(q) ||
				p.conversation.some((m) => m.text.toLowerCase().includes(q))
		);
	}, [threads, search]);

	const pendingRequests = filtered.filter((p) => p.requestedCommunication && !p.hasConnected);
	const activeStudents = filtered.filter((p) => p.hasConnected);

	function ListGroup({
		title,
		items,
		showAll,
		onToggle,
	}: {
		title: string;
		items: Student[];
		showAll: boolean;
		onToggle: () => void;
	}) {
		const visible = showAll ? items : items.slice(0, ROW_LIMIT);

		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{title}
					</h4>
					{items.length > ROW_LIMIT && (
						<Button variant="ghost" size="sm" className="h-7 px-2" onClick={onToggle}>
							{showAll ? "Show Less" : "Show All"}
						</Button>
					)}
				</div>
				<ul className="divide-y">
					{visible.map((student) => (
						<li
							key={student.id}
							className={`py-2 px-2 rounded-md cursor-pointer hover:bg-muted/60 flex items-start gap-3 ${
								student.id === selectedId ? "bg-muted" : ""
							} items-center`}
							onClick={() => openChat(student.id)}>
							<img className="w-8 h-8 rounded-full" src={student.profilePicture} />
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span className="font-medium truncate">{student.name}</span>
									{student.lastMessageUnix && (
										<span className="text-[10px] text-muted-foreground shrink-0">
											{formatWhen(student.lastMessageUnix)}
										</span>
									)}
								</div>
								<p className="text-[11px] text-muted-foreground truncate">
									{student.requestedCommunication && !student.hasConnected
										? "Request pending"
										: student.assignedToMentor
										? "Assigned"
										: "Awaiting approval"}
								</p>
							</div>
						</li>
					))}
					{!items.length && (
						<li className="py-3 text-sm text-muted-foreground">No students yet</li>
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
			<MentorDashboardSidebar activePage="messages" />
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
								<ScrollArea className="flex-1 p-4">
									<div className="space-y-3 flex flex-col">
										{selected?.conversation?.map((message) => (
											<div
												key={message.id}
												className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
													message.from === "in"
														? "bg-muted text-foreground self-start"
														: "bg-primary text-primary-foreground self-end ml-auto"
												}`}>
												{message.text}
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
													? `Message ${selected.name}`
													: "Select a student to start a conversation"
											}
											value={composer}
											onChange={(e) => setComposer(e.target.value)}
											onKeyDown={handleKeyDown}
										/>
										<Button onClick={sendMessage} disabled={!composer.trim()}>
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
								<h3 className="text-lg font-semibold">Students</h3>
							</CardHeader>
							<CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
								<div className="p-4 space-y-4">
									<Input
										placeholder="Search students & messages"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>

									<ScrollArea className="h-[calc(100vh-20rem)] pr-2">
										<div className="space-y-6">
											<ListGroup
												title="Awaiting Approval"
												items={pendingRequests}
												showAll={showAllPending}
												onToggle={() => setShowAllPending((v) => !v)}
											/>

											<ListGroup
												title="Active Connections"
												items={activeStudents}
												showAll={showAllActive}
												onToggle={() => setShowAllActive((v) => !v)}
											/>
										</div>
									</ScrollArea>
									<div className="pt-2">
										<Button className="w-full" asChild>
											<a href="/mentor/home/requests/">Manage Requests</a>
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

export default MentorMessagingLayout;
