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
import { mentors as precannedMentors } from "@/utils/people";
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

type MentorItem = {
	id: number;
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

	const currentId = React.useMemo(() => getCurrentId() ?? 0, []);
	const storagePrefix = React.useMemo(
		() => `user:${currentId || 0}:mentorDirectory`,
		[currentId]
	);

	const [search, setSearch] = useStoredState<string>(`${storagePrefix}:search`, "");

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

	const mentorAccounts = React.useMemo(
		() => allAccounts.filter((a) => a.role === "mentor" && a.id !== currentId),
		[allAccounts, currentId]
	);

	const buildMentorItem = React.useCallback(
		(mentor: Account): MentorItem => {
			const displayName =
				getDisplayNameForAccount(mentor) || mentor.email || `Mentor ${mentor.id}`;
			const type = mentor.profile?.mentorType === "teacher" ? "teacher" : "student";

			const key = currentId ? getConversationKey(currentId, mentor.id) : undefined;
			const thread = key ? conversationStore[key] : undefined;
			const conversation = currentId ? mapMessagesForViewer(thread, currentId) : [];
			const lastActivity = getLastActivityTimestamp(thread);
			const hasConnected = conversation.length > 0;

			const bio =
				mentor.profile?.mentorBio?.trim() ||
				mentor.profile?.bio?.trim() ||
				`${displayName} is available to mentor other students.`;

			return {
				id: mentor.id,
				name: displayName,
				email: mentor.email,
				type,
				bio,
				profilePicture: placeholderProfile,
				conversation,
				hasConnected,
				requestedCommunication: false,
				lastMessage: formatLastActivity(lastActivity ?? undefined),
				lastMessageUnix: lastActivity ?? undefined,
			};
		},
		[currentId, conversationStore]
	);

	const dynamicMentors = React.useMemo<MentorItem[]>(() => {
		if (!currentId) return [];

		return mentorAccounts.map(buildMentorItem);
	}, [currentId, mentorAccounts, buildMentorItem]);

	const seededMentors = React.useMemo<MentorItem[]>(() => {
		return precannedMentors.filter((mentor) => mentor.id !== currentId).map(buildMentorItem);
	}, [currentId, buildMentorItem]);

	const availableMentors = React.useMemo<MentorItem[]>(() => {
		const byId = new Map<number, MentorItem>();
		seededMentors.forEach((m) => byId.set(m.id, m));
		dynamicMentors.forEach((mentor) => {
			const existing = byId.get(mentor.id);
			if (!existing) {
				byId.set(mentor.id, mentor);
				return;
			}
			byId.set(mentor.id, {
				...existing,
				...mentor,
				conversation: mentor.conversation,
				hasConnected: mentor.hasConnected,
				requestedCommunication: mentor.requestedCommunication,
				lastMessage: mentor.lastMessage,
				lastMessageUnix: mentor.lastMessageUnix,
			});
		});
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
	}, [localThreads, dynamicMentors, seededMentors]);

	const mentorSlug = Number(useParams()["last-selected"]);

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

												setConversationRequests((prev) =>
													upsertConversationRequest(prev, {
														initiator: currentId,
														recipient: m.id,
														direction: "student_to_mentor",
													})
												);

												addStudentNotification({
													message: `Chat request sent to ${m.name}.`,
													type: "request",
													contextId: m.id,
												});

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
