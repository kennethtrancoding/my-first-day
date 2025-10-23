import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MentorDashboardSidebar from "@/features/mentor/components/MentorDashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { students, Message, Student } from "@/people";
import { useParams, useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentEmail } from "@/utils/auth";
import {
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
} from "@/hooks/useNotifications";

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
	const currentEmail = React.useMemo(() => getCurrentEmail() || "guest-mentor", []);
	const storagePrefix = React.useMemo(
		() => `user:${currentEmail}:mentorMessages`,
		[currentEmail]
	);

	const [threads, setThreads] = useStoredState<Student[]>(
		`${storagePrefix}:threads`,
		() => cloneStudentThreads()
	);
	const [selectedId, setSelectedId] = useStoredState<number | null>(
		`${storagePrefix}:selectedId`,
		null
	);
	const [composer, setComposer] = useStoredState<string>(
		`${storagePrefix}:composer`,
		""
	);
	const [search, setSearch] = useStoredState<string>(`${storagePrefix}:search`, "");

	const [showAllPending, setShowAllPending] = useStoredState<boolean>(
		`${storagePrefix}:showAllPending`,
		false
	);
	const [showAllActive, setShowAllActive] = useStoredState<boolean>(
		`${storagePrefix}:showAllActive`,
		false
	);
	const ROW_LIMIT = 6;
	const mentorDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "Your mentor",
		[]
	);

	const navigate = useNavigate();
	const { id: routeId } = useParams<{ id?: string }>();

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
		if (selectedId != null && !threads.some((p) => p.id === selectedId)) {
			setSelectedId(threads[0]?.id ?? null);
		}
	}, [threads, selectedId]);

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
		if (!text || selectedId == null) return;

		const next: Message = { id: Date.now(), from: "out", text };
		const nowStr = new Date().toLocaleString();
		const nowUnix = Date.now();

		setThreads((prevThreads) => {
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

		pushNotificationToOtherRole(
			"student",
			`${mentorDisplayName} sent you a new message.`,
			{
				type: "message",
				contextId: selectedId,
				link: `/student/home/messages/${selectedId}`,
			}
		);

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

	const pendingRequests = filtered.filter((p) => !p.assignedToMentor);
	const activeStudents = filtered.filter((p) => p.assignedToMentor || p.hasConnected);

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
									{student.assignedToMentor ? "Assigned" : "Awaiting approval"}
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
