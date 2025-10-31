import * as React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import { Account, getCurrentId, getDisplayNameForAccount } from "@/utils/auth";
import { Badge } from "@/components/ui/badge";
import {
	useNotifications,
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
} from "@/hooks/useNotifications";
import {
	CONVERSATION_STORE_KEY,
	ConversationStore,
	getConversationKey,
	mapMessagesForViewer,
	getLastActivityTimestamp,
	formatLastActivity,
	buildAccountThreadId,
	CONVERSATION_REQUESTS_KEY,
	ConversationRequestStore,
	getConversationRequest,
	upsertConversationRequest,
} from "@/utils/messaging";

// Minimal card/thread shape for this page (not the full Account)
type MentorItem = {
	id: number; // mentor account id
	name: string;
	email: string;
	type: "teacher" | "student";
	bio: string;
	profilePicture: string;
	conversation: { id: number; from: "in" | "out"; text: string }[];
	hasConnected: boolean;
	requestedCommunication: boolean;
	lastMessage?: string;
	lastMessageUnix?: number;
};

export default function StudentMentorDirectoryPage() {
	const navigate = useNavigate();

	// Current user id (student)
	const currentId = React.useMemo(() => getCurrentId() ?? 0, []);
	const storagePrefix = React.useMemo(
		() => `user:${currentId || 0}:mentorDirectory`,
		[currentId]
	);

	const [search, setSearch] = useStoredState<string>(`${storagePrefix}:search`, "");

	// Per-student "directory" memory of requested flags & last activity
	const [localThreads, setLocalThreads] = useStoredState<MentorItem[]>(
		`user:${currentId || 0}:studentMessages:threads`,
		() => []
	);

	const [conversationStore] = useStoredState<ConversationStore>(
		CONVERSATION_STORE_KEY,
		() => ({} as ConversationStore)
	);

	const [conversationRequests, setConversationRequests] =
		useStoredState<ConversationRequestStore>(
			CONVERSATION_REQUESTS_KEY,
			() => ({} as ConversationRequestStore)
		);

	const [allAccounts] = useStoredState<Account[]>("auth:accounts", () => []);

	const { addNotification: addStudentNotification } = useNotifications("student");
	const studentDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "A student",
		[]
	);

	// Pull all mentors (excluding current account)
	const mentorAccounts = React.useMemo(
		() => allAccounts.filter((a) => a.role === "mentor" && a.id !== currentId),
		[allAccounts, currentId]
	);

	// Build live mentor items from accounts + conversation store
	const dynamicMentors = React.useMemo<MentorItem[]>(() => {
		if (!currentId) return [];

		return mentorAccounts.map((mentor) => {
			const key = getConversationKey(currentId, mentor.id);
			const thread = conversationStore[key];
			const conversation = mapMessagesForViewer(thread, currentId);
			const lastActivity = getLastActivityTimestamp(thread);
			const hasConnected = conversation.length > 0;

			const name = getDisplayNameForAccount(mentor) ?? mentor.email;
			const type = mentor.profile?.mentorType === "teacher" ? "teacher" : "student";
			const bio =
				mentor.profile?.mentorBio?.trim() ||
				mentor.profile?.bio?.trim() ||
				`${name} is available to mentor other students.`;

			return {
				id: mentor.id,
				name,
				email: mentor.email,
				type,
				bio,
				profilePicture: placeholderProfile,
				conversation,
				hasConnected,
				requestedCommunication: false, // will be decorated below
				lastMessage: formatLastActivity(lastActivity ?? undefined),
				lastMessageUnix: lastActivity ?? undefined,
			};
		});
	}, [conversationStore, mentorAccounts, currentId]);

	// Merge local state (requested flags) with live dynamic mentors
	const availableMentors = React.useMemo<MentorItem[]>(() => {
		const byId = new Map<number, MentorItem>();
		// start from dynamic (authoritative for conversation)
		dynamicMentors.forEach((m) => byId.set(m.id, m));
		// overlay local-only flags (e.g., requestedCommunication)
		localThreads.forEach((local) => {
			const base = byId.get(local.id);
			if (!base) {
				byId.set(local.id, local);
			} else {
				byId.set(local.id, {
					...base,
					requestedCommunication:
						local.requestedCommunication || base.requestedCommunication,
					lastMessage: local.lastMessage ?? base.lastMessage,
					lastMessageUnix: local.lastMessageUnix ?? base.lastMessageUnix,
				});
			}
		});
		return [...byId.values()];
	}, [localThreads, dynamicMentors]);

	// Back link param (last-selected mentor route id)
	const mentorSlug = Number(useParams()["last-selected"]);

	// Search
	const filtered = React.useMemo<MentorItem[]>(() => {
		const q = search.trim().toLowerCase();
		if (!q) return availableMentors;
		return availableMentors.filter(
			(p) => p.name.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q)
		);
	}, [search, availableMentors]);

	return (
		<main className="flex-1 p-8 h-full">
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Mentor Directory</h1>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							onClick={() => navigate(`/student/home/messages/${mentorSlug}`)}
							aria-label="Back to Messages"
							className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							<span className="hidden sm:inline">Back to Messages</span>
							<span className="sm:hidden">Back</span>
						</Button>
					</div>
				</div>

				<Input
					placeholder="Search mentors by name or interests"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-md"
				/>

				<ScrollArea className="h-[calc(100vh-10rem)] pr-2">
					<div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{filtered.map((m) => {
							// Check if there is a pending request (ID-based)
							const req = getConversationRequest(
								conversationRequests,
								currentId,
								m.id
							);
							const isRequested =
								Boolean(req) || (m.requestedCommunication && !m.hasConnected);
							const buttonDisabled = isRequested;
							const buttonLabel = isRequested ? "Requested" : "Request Chat";

							return (
								<Card
									key={m.id}
									className="hover:shadow-md transition-all flex flex-col justify-between">
									<div>
										<CardHeader className="flex items-center space-x-3">
											<img
												src={m.profilePicture || placeholderProfile}
												alt={m.name}
												className="w-12 h-12 rounded-full object-cover border"
											/>
											<div className="text-center">
												<p className="font-semibold truncate">{m.name}</p>
												<p className="text-xs text-muted-foreground truncate">
													{m.type}
												</p>
											</div>
											{isRequested && (
												<Badge variant="secondary" className="ml-auto">
													Requested
												</Badge>
											)}
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground line-clamp-3">
												{m.bio}
											</p>
										</CardContent>
									</div>
									<CardFooter className="mt-auto flex justify-start">
										<Button
											size="sm"
											variant={isRequested ? "outline" : "default"}
											onClick={() => {
												if (buttonDisabled || !currentId) return;

												const nowStr = new Date().toLocaleString();
												const nowUnix = Date.now();

												// Mark as requested in local view
												setLocalThreads((prev) => {
													const exists = prev.find((t) => t.id === m.id);
													if (exists) {
														return prev.map((t) =>
															t.id === m.id
																? {
																		...t,
																		requestedCommunication:
																			true,
																		lastMessage: nowStr,
																		lastMessageUnix: nowUnix,
																  }
																: t
														);
													}
													// seed a minimal record if it wasn't there
													return [
														...prev,
														{
															...m,
															requestedCommunication: true,
															lastMessage: nowStr,
															lastMessageUnix: nowUnix,
														},
													];
												});

												// Persist a request (ID-based)
												setConversationRequests((prev) =>
													upsertConversationRequest(prev, {
														initiator: currentId,
														recipient: m.id,
														direction: "student_to_mentor",
													})
												);

												// Local notification (student)
												addStudentNotification({
													message: `Chat request sent to ${m.name}.`,
													type: "request",
													contextId: m.id,
												});

												// Notify mentor (target by recipientId)
												const studentRouteId = buildAccountThreadId(
													currentId,
													"student"
												);
												pushNotificationToOtherRole(
													"mentor",
													`${studentDisplayName} requested to connect with you.`,
													{
														type: "request",
														contextId: studentRouteId ?? m.id,
														link: `/mentor/home/messages/${
															studentRouteId ?? m.id
														}`,
														recipientId: m.id,
													}
												);

												// Jump to messages for that mentor
												navigate(`/student/home/messages/${m.id}`);
											}}
											aria-label={`Start chat with ${m.name}`}
											className="gap-2"
											disabled={buttonDisabled}>
											<MessageCircle className="h-4 w-4" />
											{buttonLabel}
										</Button>
									</CardFooter>
								</Card>
							);
						})}

						{!filtered.length && (
							<p className="text-sm text-muted-foreground col-span-full text-center py-10">
								No mentors found.
							</p>
						)}
					</div>
				</ScrollArea>
			</div>
		</main>
	);
}
