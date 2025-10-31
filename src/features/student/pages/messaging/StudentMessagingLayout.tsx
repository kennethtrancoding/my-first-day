import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import StudentDashboardSidebar from "@/features/student/components/StudentDashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import placeholderProfile from "@/assets/placeholder-profile.svg";

import { useParams, useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";

import { Account, getDisplayNameForAccount, findAccount } from "@/utils/auth";
import { useCurrentAccount } from "@/hooks/useCurrentAccount";
import { Badge } from "@/components/ui/badge";
import {
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
	useNotifications,
} from "@/hooks/useNotifications";

import {
	CONVERSATION_STORE_KEY,
	ConversationStore,
	appendConversationMessage,
	getConversationKey,
	mapMessagesForViewer,
	getLastActivityTimestamp,
	formatLastActivity,
	CONVERSATION_REQUESTS_KEY,
	ConversationRequestStore,
	getConversationRequest,
	upsertConversationRequest,
	removeConversationRequest,
} from "@/utils/messaging";

import { mentors as precannedMentors, type Message } from "@/utils/people";

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

function getDisplayNameById(id: number) {
	const acc = findAccount(id, true);
	if (acc && acc.profile) {
		return acc.profile?.displayName || acc.email || `Person ${id}`;
	}
	return `Person ${id}`;
}

type AccountWithMeta = Account & {
	displayName: string;
	profilePicture: string;
	conversation: Message[];
	hasConnected: boolean;
	requestedCommunication: boolean;
	matchedWithUser: boolean;
	lastMessage?: string;
	lastMessageUnix?: number;
};

export default function StudentMessagingLayout() {
	const navigate = useNavigate();
	const { account, currentId } = useCurrentAccount();

	const hasCompletedOnboarding = account?.wentThroughOnboarding === true;
	const shouldRedirectOnboarding = React.useMemo(
		() =>
			Boolean(
				currentId != null &&
					account &&
					account.role === "student" &&
					account.wentThroughOnboarding !== true
			),
		[account, currentId]
	);
	const shouldRedirectHome = React.useMemo(
		() => currentId == null || !account || account.role !== "student",
		[account, currentId]
	);
	const isAuthorized = React.useMemo(
		() =>
			Boolean(
				currentId != null && account && account.role === "student" && hasCompletedOnboarding
			),
		[account, currentId, hasCompletedOnboarding]
	);

	const storageIdentity = currentId ?? "anonymous-student";
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:studentMessages`,
		[storageIdentity]
	);

	const [conversationStore, setConversationStore] = useStoredState<ConversationStore>(
		CONVERSATION_STORE_KEY,
		() => ({} as ConversationStore)
	);
	const [conversationRequests, setConversationRequests] =
		useStoredState<ConversationRequestStore>(
			CONVERSATION_REQUESTS_KEY,
			() => ({} as ConversationRequestStore)
		);

	const [allAccounts] = useStoredState<Account[]>("auth:accounts", () => []);
	const mentorAccounts = React.useMemo(
		() => allAccounts.filter((a) => a.role === "mentor" && a.id !== currentId),
		[allAccounts, currentId]
	);

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

	const ROW_LIMIT = 6;
	const studentDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "A student",
		[]
	);
	const { addNotification: addStudentNotification } = useNotifications("student");

	const { id: routeId } = useParams<{ id?: string }>();

	const mkKey = (id: number) => `id:${id}`;

	const decorateFromAccount = React.useCallback(
		(acc: Account): AccountWithMeta => {
			const displayName =
				getDisplayNameForAccount(acc) ||
				acc.profile?.displayName ||
				acc.email ||
				getDisplayNameById(acc.id) ||
				`Mentor ${acc.id}`;

			const key = currentId != null ? getConversationKey(currentId, acc.id) : undefined;
			const thread = key ? conversationStore[key] : undefined;
			const conversation = currentId != null ? mapMessagesForViewer(thread, currentId) : [];
			const lastActivity = getLastActivityTimestamp(thread);

			const requested =
				currentId != null
					? Boolean(
							getConversationRequest(conversationRequests, currentId, acc.id)
								?.direction === "student_to_mentor" && conversation.length === 0
					  )
					: false;

			return {
				...acc,
				displayName,
				profilePicture: placeholderProfile,
				conversation,
				hasConnected: conversation.length > 0,
				requestedCommunication: requested,
				matchedWithUser: false,
				lastMessage: formatLastActivity(lastActivity ?? undefined),
				lastMessageUnix: lastActivity ?? undefined,
			};
		},
		[conversationStore, conversationRequests, currentId]
	);

	const decorateFromPrecanned = React.useCallback(
		(m: any): AccountWithMeta => {
			const stubAccount: Account = {
				id: m.id,
				email: m.email ?? `mentor-${m.id}@example.com`,
				password: "",
				role: "mentor",
				createdAt: Date.now(),
				profile: {
					displayName: m.name,
					bio: m.bio ?? `${m.name ?? `Mentor ${m.id}`} is available to connect.`,
					mentorType: m.type === "teacher" ? "teacher" : "student",
				},
				settings: {},
				wentThroughOnboarding: true,
				outgoingMessageRequests: [],
				messageThreads: [],
			};

			const key = currentId != null ? getConversationKey(currentId, m.id) : undefined;
			const thread = key ? conversationStore[key] : undefined;
			const conversation = currentId != null ? mapMessagesForViewer(thread, currentId) : [];
			const lastActivity = getLastActivityTimestamp(thread);

			const requested =
				currentId != null
					? Boolean(
							getConversationRequest(conversationRequests, currentId, m.id)
								?.direction === "student_to_mentor" && conversation.length === 0
					  )
					: false;

			const displayName =
				m.name || getDisplayNameById(m.id) || stubAccount.email || `Mentor ${m.id}`;

			return {
				...stubAccount,
				displayName,
				profilePicture: m.profilePicture ?? placeholderProfile,
				conversation,
				hasConnected: conversation.length > 0,
				requestedCommunication: requested,
				matchedWithUser: false,
				lastMessage: formatLastActivity(lastActivity ?? undefined),
				lastMessageUnix: lastActivity ?? undefined,
			};
		},
		[conversationStore, conversationRequests, currentId]
	);

	const mentorsUnified = React.useMemo<AccountWithMeta[]>(() => {
		if (currentId == null) return [];

		const map = new Map<string, AccountWithMeta>();

		for (const m of precannedMentors) {
			const p = decorateFromPrecanned(m);
			map.set(mkKey(p.id), p);
		}

		for (const acc of mentorAccounts) {
			const p = decorateFromAccount(acc);
			const key = mkKey(p.id);
			const existing = map.get(key);
			map.set(
				key,
				existing
					? {
							...existing,
							...p,
							conversation: p.conversation,
							hasConnected: p.hasConnected,
							requestedCommunication: p.requestedCommunication,
							lastMessage: p.lastMessage,
							lastMessageUnix: p.lastMessageUnix,
							displayName:
								p.displayName || existing.displayName || getDisplayNameById(p.id),
					  }
					: p
			);
		}

		return Array.from(map.values());
	}, [currentId, mentorAccounts, decorateFromAccount, decorateFromPrecanned]);

	const matchedMentorIds = React.useMemo(() => {
		const matches = account?.profile?.matchedMentorIds ?? [];
		return new Set(matches.slice(0, 4).map((m) => m.mentor.id));
	}, [account?.profile?.matchedMentorIds]);

	const threads = React.useMemo<AccountWithMeta[]>(() => {
		return mentorsUnified
			.map((t) => (matchedMentorIds.has(t.id) ? { ...t, matchedWithUser: true } : t))
			.sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
	}, [mentorsUnified, matchedMentorIds]);

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

	React.useEffect(() => {
		if (shouldRedirectOnboarding) {
			navigate("/onboarding/", { replace: true });
			return;
		}
		if (!isAuthorized || shouldRedirectHome) {
			navigate("/", { replace: true });
		}
	}, [isAuthorized, navigate, shouldRedirectHome, shouldRedirectOnboarding]);

	const selected = React.useMemo(
		() => (selectedId == null ? undefined : threads.find((p) => p.id === selectedId)),
		[threads, selectedId]
	);

	const endRef = React.useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [selectedId, selected?.conversation.length]);

	function openChat(accountId: number) {
		setSelectedId(accountId);
		navigate(`/student/home/messages/${accountId}`);
	}

	function requestChat(target?: AccountWithMeta) {
		const acc = target ?? selected;
		if (!acc || acc.hasConnected) return;
		if (currentId == null) return;

		const existing = getConversationRequest(conversationRequests, currentId, acc.id);
		if (existing) return;

		setConversationRequests((prev) =>
			upsertConversationRequest(prev, {
				initiator: currentId,
				recipient: acc.id,
				direction: "student_to_mentor",
			})
		);

		addStudentNotification({
			message: `Chat request sent to ${acc.displayName || getDisplayNameById(acc.id)}.`,
			type: "request",
			contextId: acc.id,
		});

		pushNotificationToOtherRole(
			"mentor",
			`${studentDisplayName} requested to connect with you.`,
			{
				type: "request",
				contextId: acc.id,
				link: `/mentor/home/messages/${acc.id}`,
				id: acc.id,
			}
		);
	}

	function sendMessage() {
		const text = composer.trim();
		if (!text || selectedId == null || !selected) return;
		if (currentId == null) return;

		if (selected.requestedCommunication && !selected.hasConnected) return;

		setConversationStore((prevStore) =>
			appendConversationMessage(prevStore, {
				from: currentId,
				to: selected.id,
				text,
			})
		);

		setConversationRequests((prev) => removeConversationRequest(prev, currentId, selected.id));

		pushNotificationToOtherRole("mentor", `${studentDisplayName} sent you a new message.`, {
			type: "message",
			contextId: selected.id,
			link: `/mentor/home/messages/${selected.id}`,
			id: selected.id,
		});

		setComposer("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	const filtered: AccountWithMeta[] = React.useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return threads;
		return threads.filter(
			(p) =>
				(p.displayName?.toLowerCase() ?? "").includes(q) ||
				(p.profile?.bio ?? "").toLowerCase().includes(q) ||
				p.conversation.some((m) => m.text.toLowerCase().includes(q))
		);
	}, [threads, search]);

	const requested = filtered.filter((p) => p.requestedCommunication && !p.hasConnected);

	// FIX: Return AccountWithMeta[] of matched mentors, not raw match objects
	const matched: AccountWithMeta[] = React.useMemo(
		() => filtered.filter((p) => matchedMentorIds.has(p.id)),
		[filtered, matchedMentorIds]
	);

	const connected = filtered.filter((p) => p.hasConnected && !p.requestedCommunication);

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
		items: AccountWithMeta[];
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
					{visible.map((p) => {
						const name = p.displayName || getDisplayNameById(p.id);
						return (
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
										src={p.profilePicture || placeholderProfile}
										alt={`${name} avatar`}
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<span className="font-medium truncate">{name}</span>
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
						);
					})}
					{!items.length && (
						<li className="py-3 text-sm text-muted-foreground">{emptyLabel}</li>
					)}
				</ul>
			</div>
		);
	}

	if (!isAuthorized) return null;

	const selectedName = selected
		? selected.displayName || getDisplayNameById(selected.id)
		: undefined;

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
									{selectedName ?? "Messages"}
								</h3>
							</CardHeader>

							<CardContent className="flex-1 flex flex-col p-0">
								{canRequestSelected && selected && (
									<div className="px-4 pt-4">
										<div className="rounded-md border border-dashed bg-muted/50 p-3 space-y-3 text-sm text-muted-foreground">
											<p>
												Request to chat with {selectedName}. We'll notify
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
											Your request to chat with {selectedName} is pending.
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
													(m as any).from === "in"
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
												selectedName
													? isPendingSelected
														? `Waiting for ${selectedName} to accept`
														: canRequestSelected
														? `Request to chat with ${selectedName}`
														: `Chat with ${selectedName}`
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

					{/* People/right rail */}
					{/* FIX: Tailwind class typo (max-h-[...]) */}
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
												href={`/student/home/messages/mentors-directory/${
													selectedId ?? ""
												}`}>
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
