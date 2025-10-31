import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import { useNavigate, useParams } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentId, type Account, getDisplayNameForAccount, findAccount } from "@/utils/auth";
import {
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
} from "@/hooks/useNotifications";
import {
	appendConversationMessage,
	buildAccountThreadId,
	CONVERSATION_STORE_KEY,
	type ConversationStore,
	formatLastActivity,
	getConversationKey,
	getLastActivityTimestamp,
	mapMessagesForViewer,
	CONVERSATION_REQUESTS_KEY,
	type ConversationRequestStore,
	getConversationRequest,
	removeConversationRequest,
} from "@/utils/messaging";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import TeacherDashboardSidebar from "../../components/TeacherDashboardSidebar";

// Minimal UI thread item shape for this page
type ThreadItem = {
	id: number; // student account id
	name: string;
	email: string;
	profilePicture: string;
	bio?: string;
	grade?: number;
	hasConnected: boolean;
	requestedCommunication: boolean;
	assignedToMentor?: boolean;
	conversation: { id: number; from: "in" | "out"; text: string }[];
	lastMessage?: string;
	lastMessageUnix?: number;
};

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

function TeacherMessagingLayout() {
	const navigate = useNavigate();
	const currentId = React.useMemo(() => getCurrentId() ?? 0, []);
	const account = React.useMemo(
		() => (currentId ? findAccount(currentId) ?? null : null),
		[currentId]
	);

	const hasCompletedOnboarding = account?.wentThroughOnboarding === true;
	const shouldRedirectHome = React.useMemo(
		() => !currentId || !account || account.role !== "mentor",
		[account, currentId]
	);
	const isAuthorized = React.useMemo(
		() => Boolean(currentId && account && account.role === "mentor" && hasCompletedOnboarding),
		[account, currentId, hasCompletedOnboarding]
	);

	const storagePrefix = React.useMemo(
		() => `user:${currentId || 0}:teacherMessages`,
		[currentId]
	);

	// Local UI-only memory (requested flag, lastMessage timestamps, etc.)
	const [localThreads, setLocalThreads] = useStoredState<ThreadItem[]>(
		`${storagePrefix}:threads`,
		() => []
	);

	const [conversationStore, setConversationStore] = useStoredState<ConversationStore>(
		CONVERSATION_STORE_KEY,
		() => ({} as ConversationStore)
	);
	const [allAccounts] = useStoredState<Account[]>("auth:accounts", () => []);
	const [selectedId, setSelectedId] = useStoredState<number | null>(
		`${storagePrefix}:selectedId`,
		null
	);
	const [composer, setComposer] = useStoredState<string>(`${storagePrefix}:composer`, "");
	const [search, setSearch] = useStoredState<string>(`${storagePrefix}:search`, "");

	const [showAllNew, setShowAllNew] = useStoredState<boolean>(
		`${storagePrefix}:showAllNew`,
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

	const { id: routeId } = useParams<{ id?: string }>();
	const teacherDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "A teacher",
		[]
	);
	const ROW_LIMIT = 6;

	// All students except me
	const studentAccounts = React.useMemo(
		() => allAccounts.filter((acc) => acc.role === "student" && acc.id !== currentId),
		[allAccounts, currentId]
	);

	// Build dynamic threads from store (authoritative for messages)
	const dynamicStudentThreads = React.useMemo<ThreadItem[]>(() => {
		if (!currentId) return [];
		return studentAccounts.map((student) => {
			const key = getConversationKey(currentId, student.id);
			const thread = conversationStore[key];
			const conversation = mapMessagesForViewer(thread, currentId);
			const lastActivity = getLastActivityTimestamp(thread);
			const hasConnected = conversation.length > 0;
			const displayName = getDisplayNameForAccount(student) ?? student.email;
			const parsedGrade = Number.parseInt(student.profile?.grade ?? "", 10);

			return {
				id: student.id,
				name: displayName,
				email: student.email,
				grade: Number.isNaN(parsedGrade) ? undefined : parsedGrade,
				assignedToMentor: hasConnected,
				hasConnected,
				requestedCommunication: false, // decorated later
				bio: student.profile?.bio?.trim() || `${displayName} recently joined My First Day.`,
				profilePicture: placeholderProfile,
				conversation,
				lastMessage: formatLastActivity(lastActivity ?? undefined),
				lastMessageUnix: lastActivity ?? undefined,
			};
		});
	}, [conversationStore, studentAccounts, currentId]);

	// Merge with local UI flags (requestedCommunication, lastMessage overrides)
	const threads = React.useMemo<ThreadItem[]>(() => {
		const merged = new Map<number, ThreadItem>();
		dynamicStudentThreads.forEach((t) => merged.set(t.id, t));
		localThreads.forEach((t) => {
			const base = merged.get(t.id);
			if (!base) {
				merged.set(t.id, t);
			} else {
				merged.set(t.id, {
					...base,
					requestedCommunication: t.requestedCommunication || base.requestedCommunication,
					lastMessage: t.lastMessage ?? base.lastMessage,
					lastMessageUnix: t.lastMessageUnix ?? base.lastMessageUnix,
				});
			}
		});

		// decorate pending requests (ID based)
		const decorated = [...merged.values()].map((t) => {
			const req = getConversationRequest(conversationRequests, t.id, currentId);
			if (req?.direction === "student_to_mentor" && !t.hasConnected) {
				return { ...t, requestedCommunication: true };
			}
			return t;
		});

		return decorated.sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
	}, [dynamicStudentThreads, localThreads, conversationRequests, currentId]);

	// Route -> selection
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
		if (selectedId != null && !threads.some((s) => s.id === selectedId)) {
			setSelectedId(threads[0]?.id ?? null);
		}
	}, [selectedId, threads, setSelectedId]);

	const selected = React.useMemo(
		() => (selectedId == null ? undefined : threads.find((s) => s.id === selectedId)),
		[threads, selectedId]
	);

	const endRef = React.useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [selectedId, selected?.conversation.length]);

	function openChat(studentId: number) {
		if (studentId !== selectedId) {
			setSelectedId(studentId);
			navigate(`/teacher/home/messages/${studentId}`, { replace: false });
		}
	}

	function sendMessage() {
		const text = composer.trim();
		if (!text || selectedId == null || !selected || !currentId) return;

		const nowStr = new Date().toLocaleString();
		const nowUnix = Date.now();

		// Persist to the shared conversation store (ID-based)
		setConversationStore((prevStore) =>
			appendConversationMessage(prevStore, {
				from: currentId,
				to: selected.id,
				text,
			})
		);

		// Any pending request can be cleared now (ID-based)
		setConversationRequests((prev) => removeConversationRequest(prev, selected.id, currentId));

		// Update local UI list to bump timestamps
		setLocalThreads((prev) => {
			const updated = prev.map((t) =>
				t.id !== selected.id
					? t
					: {
							...t,
							hasConnected: true,
							assignedToMentor: true,
							requestedCommunication: false,
							lastMessage: nowStr,
							lastMessageUnix: nowUnix,
					  }
			);
			// ensure item exists in case it wasn't in local list
			if (!updated.some((t) => t.id === selected.id)) {
				updated.push({
					...selected,
					hasConnected: true,
					assignedToMentor: true,
					requestedCommunication: false,
					lastMessage: nowStr,
					lastMessageUnix: nowUnix,
				});
			}
			return updated.sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
		});

		// Notify student
		const studentRouteId = buildAccountThreadId(currentId, "mentor");
		pushNotificationToOtherRole("student", `${teacherDisplayName} sent you a new message.`, {
			type: "message",
			contextId: studentRouteId,
			link: `/student/home/messages/${studentRouteId ?? selectedId}`,
			recipientId: selected.id,
		});

		setComposer("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	const filtered = React.useMemo<ThreadItem[]>(() => {
		const q = search.trim().toLowerCase();
		if (!q) return threads;
		return threads.filter(
			(s) =>
				s.name.toLowerCase().includes(q) ||
				(s.bio ?? "").toLowerCase().includes(q) ||
				s.conversation.some((m) => m.text.toLowerCase().includes(q))
		);
	}, [search, threads]);

	const newStudents = filtered.filter((s) => s.requestedCommunication && !s.hasConnected);
	const activeStudents = filtered.filter((s) => s.hasConnected);

	function ListGroup({
		title,
		items,
		showAll,
		onToggle,
		emptyLabel,
	}: {
		title: string;
		items: ThreadItem[];
		showAll: boolean;
		onToggle: () => void;
		emptyLabel: string;
	}) {
		const visible = showAll ? items : items.slice(0, ROW_LIMIT);
		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{title}
					</h4>
					{items.length > ROW_LIMIT && (
						<Button variant="ghost" size="sm" className="text-xs" onClick={onToggle}>
							{showAll ? "Show less" : "Show all"}
						</Button>
					)}
				</div>
				<ul className="space-y-1">
					{visible.map((s) => (
						<li
							key={s.id}
							className={`flex gap-3 rounded-lg p-2 cursor-pointer transition hover:bg-muted/70 ${
								s.id === selectedId ? "bg-muted" : ""
							} items-center`}
							onClick={() => openChat(s.id)}>
							<img
								className="w-8 h-8 rounded-full"
								src={s.profilePicture}
								alt={s.name}
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span className="font-medium truncate">{s.name}</span>
									{s.lastMessageUnix && (
										<span className="text-[10px] text-muted-foreground shrink-0">
											{formatWhen(s.lastMessageUnix)}
										</span>
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

	if (!isAuthorized || shouldRedirectHome) {
		return null;
	}

	return (
		<SidebarProvider>
			<TeacherDashboardSidebar activePage="messages" />
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

					<aside className="w-full md:w-[360px] max-h-[calc(100vh-8rem)]">
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
												title="Message requests"
												items={newStudents}
												showAll={showAllNew}
												onToggle={() => setShowAllNew((v) => !v)}
												emptyLabel="No new message requests."
											/>
											<ListGroup
												title="Conversations"
												items={activeStudents}
												showAll={showAllActive}
												onToggle={() => setShowAllActive((v) => !v)}
												emptyLabel="Start a conversation to see it here."
											/>
										</div>
									</ScrollArea>
								</div>
							</CardContent>
						</Card>
					</aside>
				</div>
			</main>
		</SidebarProvider>
	);
}

export default TeacherMessagingLayout;
