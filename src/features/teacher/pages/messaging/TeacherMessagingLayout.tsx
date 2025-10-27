import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { students, type Message, type Student } from "@/utils/people";
import { useNavigate, useParams } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import {
	findAccount,
	getCurrentEmail,
	type StoredAccount,
	getDisplayNameForAccount,
} from "@/utils/auth";
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
	ConversationRequestStore,
	getConversationRequest,
	removeConversationRequest,
} from "@/utils/messaging";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import TeacherDashboardSidebar from "../../components/TeacherDashboardSidebar";

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

function TeacherMessagingLayout() {
	const navigate = useNavigate();
	const currentEmail = React.useMemo(() => getCurrentEmail() ?? null, []);
	const storageIdentity = currentEmail ?? "anonymous-teacher";
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:teacherMessages`,
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

	const studentAccounts = React.useMemo(
		() =>
			allAccounts.filter(
				(acc) => acc.role === "student" && acc.email && acc.email !== currentEmail
			),
		[allAccounts, currentEmail]
	);

	const dynamicStudentThreads = React.useMemo(() => {
		if (!currentEmail) {
			return [] as Student[];
		}

		return studentAccounts.map((studentAccount) => {
			const key = getConversationKey(currentEmail, studentAccount.email!);
			const thread = conversationStore[key];
			const conversation = mapMessagesForViewer(thread, currentEmail);
			const lastActivity = getLastActivityTimestamp(thread);
			const hasConnected = conversation.length > 0;
			const displayName = getDisplayNameForAccount(studentAccount) ?? studentAccount.email!;
			const parsedGrade = Number.parseInt(studentAccount.profile?.grade ?? "", 10);
			return {
				id: buildAccountThreadId(studentAccount.email!, "student"),
				name: displayName,
				grade: Number.isNaN(parsedGrade) ? undefined : parsedGrade,
				assignedToMentor: hasConnected,
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
	}, [conversationStore, studentAccounts, currentEmail]);

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
		return decorated.sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
	}, [dynamicStudentThreads, localThreads, conversationRequests, currentEmail]);

	React.useEffect(() => {
		if (routeId) {
			const parsed = Number(routeId);
			if (!Number.isNaN(parsed)) {
				setSelectedId(parsed);
				return;
			}
		}
		setSelectedId((prev) => (prev == null && threads.length ? threads[0].id : prev));
	}, [routeId, threads]);

	React.useEffect(() => {
		if (selectedId != null && !threads.some((student) => student.id === selectedId)) {
			setSelectedId(threads[0]?.id ?? null);
		}
	}, [selectedId, threads]);

	const selected = React.useMemo(
		() =>
			selectedId == null ? undefined : threads.find((student) => student.id === selectedId),
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

		pushNotificationToOtherRole("student", `${teacherDisplayName} sent you a new message.`, {
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
			(student) =>
				student.name.toLowerCase().includes(q) ||
				(student.bio ?? "").toLowerCase().includes(q) ||
				student.conversation.some((message) => message.text.toLowerCase().includes(q))
		);
	}, [search, threads]);

	const newStudents = filtered.filter(
		(student) => student.requestedCommunication && !student.hasConnected
	);
	const activeStudents = filtered.filter((student) => student.hasConnected);

	function ListGroup({
		title,
		items,
		showAll,
		onToggle,
		emptyLabel,
	}: {
		title: string;
		items: Student[];
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
					{visible.map((student) => (
						<li
							key={student.id}
							className={`flex gap-3 rounded-lg p-2 cursor-pointer transition hover:bg-muted/70 ${
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
											onChange={(event) => setComposer(event.target.value)}
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
										onChange={(event) => setSearch(event.target.value)}
									/>

									<ScrollArea className="h-[calc(100vh-20rem)] pr-2">
										<div className="space-y-6">
											<ListGroup
												title="Message requests"
												items={newStudents}
												showAll={showAllNew}
												onToggle={() => setShowAllNew((prev) => !prev)}
												emptyLabel="No new message requests."
											/>

											<ListGroup
												title="Conversations"
												items={activeStudents}
												showAll={showAllActive}
												onToggle={() => setShowAllActive((prev) => !prev)}
												emptyLabel="Start a conversation to see it here."
											/>
										</div>
									</ScrollArea>
								</div>
							</CardContent>
						</Card>
					</aside>
				</div>{" "}
			</main>
		</SidebarProvider>
	);
}

export default TeacherMessagingLayout;
