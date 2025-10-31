import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MentorDashboardSidebar from "@/features/mentor/components/MentorDashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { students as seedStudents, Message } from "@/utils/people";
import { useParams, useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import { Account, findAccounts, getCurrentId } from "@/utils/auth";
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

type ThreadItem = {
	id: number;
	name: string;
	email: string;
	profilePicture: string;
	bio?: string;
	grade?: number;
	assignedToMentor?: boolean;

	conversation: Message[];
	lastMessage?: string;
	lastMessageUnix?: number;
	hasConnected: boolean;
	requestedCommunication: boolean;
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

function cloneStudentThreads(): ThreadItem[] {
	return seedStudents.map((s) => ({
		id: s.id,
		name: (s as any).name ?? s.email ?? `Student ${s.id}`,
		email: s.email ?? "",
		profilePicture: (s as any).profilePicture ?? placeholderProfile,
		bio: (s as any).bio ?? "",
		grade: Number.parseInt((s as any).grade ?? "", 10) || undefined,
		assignedToMentor: false,
		conversation: [],
		hasConnected: false,
		requestedCommunication: false,
	}));
}

function MentorMessagingLayout() {
	const navigate = useNavigate();

	const currentId = React.useMemo(() => getCurrentId() ?? null, []);
	const account = React.useMemo(
		() => (currentId ? findAccounts({ ids: [currentId] })[0] ?? null : null),
		[currentId]
	);

	const hasCompletedOnboarding = account?.wentThroughOnboarding === true;

	const shouldRedirectOnboarding = React.useMemo(
		() =>
			Boolean(
				currentId &&
					account &&
					account.role === "mentor" &&
					account.wentThroughOnboarding !== true
			),
		[account, currentId]
	);

	const shouldRedirectHome = React.useMemo(
		() => !currentId || !account || account.role !== "mentor",
		[account, currentId]
	);

	const isAuthorized = React.useMemo(
		() => Boolean(currentId && account && account.role === "mentor" && hasCompletedOnboarding),
		[account, currentId, hasCompletedOnboarding]
	);

	const storageIdentity = currentId ?? 0;
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:mentorMessages`,
		[storageIdentity]
	);

	const [localThreads, setLocalThreads] = useStoredState<ThreadItem[]>(
		`${storagePrefix}:threads`,
		() => cloneStudentThreads()
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
		() => allAccounts.filter((a) => a.role === "student" && a.id !== currentId),
		[currentId, allAccounts]
	);

	const dynamicStudentThreads = React.useMemo<ThreadItem[]>(() => {
		if (!currentId) return [];

		return studentAccounts.map((student) => {
			const key = getConversationKey(currentId, student.id);
			const thread = conversationStore[key];
			const conversation = mapMessagesForViewer(thread, currentId);
			const lastActivity = getLastActivityTimestamp(thread);
			const hasConnected = conversation.length > 0;

			const displayName = student.profile?.displayName ?? student.email;
			const parsedGrade = Number.parseInt(student.profile?.grade ?? "", 10);
			const matchedMentors = student.profile?.matchedMentorIds ?? [];
			const isAssignedToCurrentMentor = Boolean(
				account && matchedMentors.some((match) => match.mentor.id === (account?.id ?? -1))
			);

			return {
				id: student.id,
				name: displayName,
				email: student.email,
				profilePicture: placeholderProfile,
				bio: student.profile?.bio?.trim() || `${displayName} recently joined My First Day.`,
				grade: Number.isNaN(parsedGrade) ? undefined : parsedGrade,
				assignedToMentor: isAssignedToCurrentMentor,
				conversation,
				hasConnected,
				requestedCommunication: false,
				lastMessage: formatLastActivity(lastActivity ?? undefined),
				lastMessageUnix: lastActivity ?? undefined,
			};
		});
	}, [conversationStore, studentAccounts, currentId, account]);

	const threads = React.useMemo<ThreadItem[]>(() => {
		const merged = new Map<number, ThreadItem>();
		dynamicStudentThreads.forEach((t) => merged.set(t.id, t));
		localThreads.forEach((t) => {
			if (!merged.has(t.id)) merged.set(t.id, t);
		});

		const decorated = [...merged.values()].map((thread) => {
			if (currentId && thread.id) {
				const req = getConversationRequest(conversationRequests, thread.id, currentId);
				if (req?.direction === "student_to_mentor" && !thread.hasConnected) {
					return { ...thread, requestedCommunication: true };
				}
			}
			return thread;
		});

		return decorated
			.filter((t) => t.hasConnected || t.requestedCommunication)
			.sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
	}, [dynamicStudentThreads, localThreads, conversationRequests, currentId]);
	const hasSidebarThreads = threads.length > 0;

	const assignedStudentThreads = React.useMemo(
		() => threads.filter((t) => t.assignedToMentor),
		[threads]
	);
	const connectedStudentThreads = React.useMemo(
		() => threads.filter((t) => t.hasConnected),
		[threads]
	);
	const pendingStudentThreads = React.useMemo(
		() => threads.filter((t) => t.requestedCommunication && !t.hasConnected),
		[threads]
	);
	const defaultThreadId = React.useMemo(() => {
		const priorityLists: ThreadItem[][] = [
			assignedStudentThreads,
			connectedStudentThreads,
			pendingStudentThreads,
			threads,
		];
		for (const group of priorityLists) {
			const candidate = group.find((item) => item?.id != null);
			if (candidate) {
				return candidate.id;
			}
		}
		return threads.length === 0 ? 0 : null;
	}, [assignedStudentThreads, connectedStudentThreads, pendingStudentThreads, threads]);
	const placeholderThread = React.useMemo<ThreadItem>(
		() => ({
			id: 0,
			name: "Messages",
			email: "",
			profilePicture: placeholderProfile,
			conversation: [],
			lastMessage: undefined,
			lastMessageUnix: undefined,
			hasConnected: false,
			requestedCommunication: false,
			assignedToMentor: false,
		}),
		[]
	);

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
		if (!routeId) return;
		const parsed = Number(routeId);
		if (!Number.isNaN(parsed)) {
			setSelectedId(parsed);
		}
	}, [routeId, setSelectedId]);

	React.useEffect(() => {
		if (routeId) return;
		if (defaultThreadId == null) return;
		if (selectedId === defaultThreadId) return;
		setSelectedId(defaultThreadId);
		navigate(`/mentor/home/messages/${defaultThreadId}`, { replace: true });
	}, [routeId, defaultThreadId, navigate, selectedId, setSelectedId]);

	React.useEffect(() => {
		const hasSelection =
			selectedId != null &&
			(threads.some((thread) => thread.id === selectedId) ||
				(!hasSidebarThreads && selectedId === 0));
		if (hasSelection) {
			return;
		}
		const fallbackId = defaultThreadId;
		if (fallbackId == null) {
			if (selectedId != null) {
				setSelectedId(null);
			}
			return;
		}
		if (selectedId !== fallbackId) {
			setSelectedId(fallbackId);
		}
		const parsedRoute = routeId ? Number(routeId) : NaN;
		if (!routeId || Number.isNaN(parsedRoute) || parsedRoute !== fallbackId) {
			navigate(`/mentor/home/messages/${fallbackId}`, { replace: true });
		}
	}, [threads, selectedId, defaultThreadId, navigate, routeId, setSelectedId, hasSidebarThreads]);

	const selected = React.useMemo(() => {
		if (!hasSidebarThreads) {
			return placeholderThread;
		}
		return selectedId == null ? undefined : threads.find((p) => p.id === selectedId);
	}, [threads, selectedId, placeholderThread, hasSidebarThreads]);
	const showPlaceholder = !hasSidebarThreads;
	React.useEffect(() => {
		if (showPlaceholder && composer) {
			setComposer("");
		}
	}, [showPlaceholder, composer, setComposer]);

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
		if (!text || selectedId == null || !selected || showPlaceholder || !currentId) return;

		const nowStr = new Date().toLocaleString();
		const nowUnix = Date.now();

		setConversationStore((prev) =>
			appendConversationMessage(prev, {
				from: currentId,
				to: selected.id,
				text,
			})
		);

		setConversationRequests((prev) => removeConversationRequest(prev, selected.id, currentId));

		setLocalThreads((prev) => {
			const nextMsg: Message = { id: Date.now(), from: "out", text };

			const updatedThreads = prev.map((thread) =>
				thread.id !== selectedId
					? thread
					: {
							...thread,
							hasConnected: true,
							assignedToMentor: true,
							conversation: [...thread.conversation, nextMsg],
							lastMessage: nowStr,
							lastMessageUnix: nowUnix,
					  }
			);

			return [...updatedThreads].sort(
				(a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0)
			);
		});

		const studentRouteId = buildAccountThreadId(selected.id, "student");
		pushNotificationToOtherRole("student", `${mentorDisplayName} sent you a new message.`, {
			type: "message",
			contextId: studentRouteId,
			link: `/student/home/messages/${studentRouteId}`,

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

	const filtered: ThreadItem[] = React.useMemo(() => {
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
		items: ThreadItem[];
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
							<img
								className="w-8 h-8 rounded-full"
								src={student.profilePicture}
								alt=""
							/>
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
										{showPlaceholder ? (
											<div className="flex-1 flex items-center justify-center py-12 text-sm text-muted-foreground text-center">
												No student conversations yet. Once a student reaches
												out, their messages will appear here.
											</div>
										) : (
											selected?.conversation?.map((message) => (
												<div
													key={message.id}
													className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
														message.from === "in"
															? "bg-muted text-foreground self-start"
															: "bg-primary text-primary-foreground self-end ml-auto"
													}`}>
													{message.text}
												</div>
											))
										)}
										<div ref={endRef} />
									</div>
								</ScrollArea>

								<div className="p-4 border-t bg-card mt-auto sticky bottom-0">
									<div className="flex gap-2">
										<textarea
											rows={1}
											className="flex-1 rounded-md border border-input p-2 resize-none"
											placeholder={
												showPlaceholder
													? "No students available to message yet"
													: selected?.name
													? `Message ${selected.name}`
													: "Select a student to start a conversation"
											}
											disabled={showPlaceholder}
											value={composer}
											onChange={(e) => setComposer(e.target.value)}
											onKeyDown={handleKeyDown}
										/>
										<Button
											onClick={sendMessage}
											disabled={showPlaceholder || !composer.trim()}>
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
