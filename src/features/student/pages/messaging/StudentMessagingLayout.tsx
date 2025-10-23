import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import StudentDashboardSidebar from "@/features/student/components/StudentDashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { mentors, Message, Person } from "@/people";
import { useParams, useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentEmail } from "@/utils/auth";
import { Badge } from "@/components/ui/badge";
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

function cloneMentorThreads(): Person[] {
	return mentors.map((mentor) => ({
		...mentor,
		conversation: mentor.conversation.map((message) => ({ ...message })),
	}));
}

function StudentMessagingLayout() {
	const currentEmail = React.useMemo(() => getCurrentEmail() || "guest", []);
	const storagePrefix = React.useMemo(
		() => `user:${currentEmail}:studentMessages`,
		[currentEmail]
	);

	const [threads, setThreads] = useStoredState<Person[]>(`${storagePrefix}:threads`, () =>
		cloneMentorThreads()
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

	function openChat(personId: number) {
		if (personId !== selectedId) {
			setSelectedId(personId);
			navigate(`/student/home/messages/${personId}`, { replace: false });
		}
	}

	function sendMessage() {
		const text = composer.trim();
		if (!text || selectedId == null) return;

		const next: Message = { id: Date.now(), from: "out", text };
		const nowStr = new Date().toLocaleString();
		const nowUnix = Date.now();

		setThreads((prevThreads) => {
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

			return [...updated].sort((a, b) => (b.lastMessageUnix || 0) - (a.lastMessageUnix || 0));
		});

		pushNotificationToOtherRole("mentor", `${studentDisplayName} sent you a new message.`, {
			type: "message",
			contextId: selectedId,
			link: `/mentor/home/messages/${selectedId}`,
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
	const matched = filtered.filter((p) => p.matchedWithUser);
	const connected = filtered.filter(
		(p) => p.hasConnected && !p.requestedCommunication && !p.matchedWithUser
	);
	const outstandingRequestCount = React.useMemo(
		() => threads.filter((p) => p.requestedCommunication && !p.hasConnected).length,
		[threads]
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
							className={`py-2 px-2 rounded-md cursor-pointer hover:bg-muted/60 flex items-start gap-3 ${
								p.id === selectedId ? "bg-muted" : ""
							} items-center`}
							onClick={() => openChat(p.id)}>
							<img className="w-8 h-8" src={p.profilePicture} />
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
									<Badge className="mt-1 w-fit text-[10px]" variant="secondary">
										Requested
									</Badge>
								)}
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
														: `Chat with ${selected.name}`
													: "Start a conversation"
											}
											value={composer}
											onChange={(e) => setComposer(e.target.value)}
											onKeyDown={handleKeyDown}
											disabled={isPendingSelected}
										/>
										<Button
											onClick={sendMessage}
											disabled={isPendingSelected || !composer.trim()}>
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
