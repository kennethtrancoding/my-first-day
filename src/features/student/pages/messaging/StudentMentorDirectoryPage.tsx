import * as React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mentors, Person } from "@/people";
import profilePicture from "@/assets/placeholder-profile.svg";
import { useParams } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import {
	StoredAccount,
	getCurrentEmail,
	getDisplayNameForAccount,
} from "@/utils/auth";
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

function cloneMentorThreads(): Person[] {
	return mentors.map((mentor) => ({
		...mentor,
		conversation: mentor.conversation.map((message) => ({ ...message })),
	}));
}

export default function StudentMentorDirectoryPage() {
	const currentEmail = React.useMemo(() => getCurrentEmail() || "guest", []);
	const storagePrefix = React.useMemo(
		() => `user:${currentEmail}:mentorDirectory`,
		[currentEmail]
	);
	const [search, setSearch] = useStoredState<string>(`${storagePrefix}:search`, "");
	const [localThreads, setLocalThreads] = useStoredState<Person[]>(
		`user:${currentEmail}:studentMessages:threads`,
		() => cloneMentorThreads()
	);
	const [conversationStore] = useStoredState<ConversationStore>(
		CONVERSATION_STORE_KEY,
		() => ({} as ConversationStore)
	);
	const [conversationRequests, setConversationRequests] =
		useStoredState<ConversationRequestStore>(CONVERSATION_REQUESTS_KEY, () => ({} as ConversationRequestStore));
	const [allAccounts] = useStoredState<StoredAccount[]>("auth:accounts", () => []);
	const navigate = useNavigate();
	const { addNotification: addStudentNotification } = useNotifications("student");
	const studentDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "A student",
		[]
	);

	const mentorAccounts = React.useMemo(
		() =>
			allAccounts.filter(
				(account) => account.role === "mentor" && account.email !== currentEmail
			),
		[allAccounts, currentEmail]
	);

	const dynamicMentors = React.useMemo(() => {
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
					`${name} is available to mentor other students.`,
				profilePicture: profilePicture,
				email: mentorAccount.email,
				conversation,
				lastMessage: formatLastActivity(lastActivity),
				lastMessageUnix: lastActivity,
			} as Person;
		});
	}, [conversationStore, mentorAccounts, currentEmail]);

	const availableMentors = React.useMemo(() => {
		const map = new Map<number, Person>();
		localThreads.forEach((mentor) => map.set(mentor.id, mentor));
		dynamicMentors.forEach((mentor) => map.set(mentor.id, mentor));
		return [...map.values()];
	}, [localThreads, dynamicMentors]);

	const mentorSlug = Number(useParams()["last-selected"]);

	const filtered = React.useMemo<Person[]>(() => {
		const q = search.trim().toLowerCase();
		if (!q) {
			return availableMentors;
		}
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
							const storedMentor =
								localThreads.find((thread) => thread.id === m.id) ?? m;
							const requestFromStore =
								currentEmail && m.email
									? getConversationRequest(conversationRequests, currentEmail, m.email)
									: undefined;
							const isRequested =
								Boolean(requestFromStore) ||
								Boolean(storedMentor.requestedCommunication && !storedMentor.hasConnected);
							const buttonDisabled = isRequested;
							const buttonLabel = isRequested ? "Requested" : "Request Chat";

							return (
								<Card
									key={m.id}
									className="hover:shadow-md transition-all flex flex-col justify-between">
									<div>
										<CardHeader className="flex items-center space-x-3">
											<img
												src={m.profilePicture || profilePicture}
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
												if (buttonDisabled) {
													return;
												}

												const nowStr = new Date().toLocaleString();
												const nowUnix = Date.now();

												setLocalThreads((prev) =>
													prev.map((thread) =>
														thread.id === m.id
															? {
																	...thread,
																	requestedCommunication: true,
																	lastMessage: nowStr,
																	lastMessageUnix: nowUnix,
															  }
															: thread
													)
												);

												if (currentEmail && m.email) {
													setConversationRequests((prev) =>
														upsertConversationRequest(prev, {
															initiator: currentEmail,
															recipient: m.email!,
															direction: "student_to_mentor",
														})
													);
												}

												addStudentNotification({
													message: `Chat request sent to ${m.name}.`,
													type: "request",
													contextId: m.id,
												});
												const studentRouteId =
													currentEmail
														? buildAccountThreadId(currentEmail, "student")
														: m.id;
												pushNotificationToOtherRole(
													"mentor",
													`${studentDisplayName} requested to connect with you.`,
													{
														type: "request",
														contextId: studentRouteId ?? m.id,
														link: `/mentor/home/messages/${studentRouteId ?? m.id}`,
														email: m.email,
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
