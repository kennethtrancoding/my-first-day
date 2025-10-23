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
import { getCurrentEmail } from "@/utils/auth";
import { Badge } from "@/components/ui/badge";
import {
	useNotifications,
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
} from "@/hooks/useNotifications";

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
	const [threads, setThreads] = useStoredState<Person[]>(
		`user:${currentEmail}:studentMessages:threads`,
		() => cloneMentorThreads()
	);
	const navigate = useNavigate();
	const { addNotification: addStudentNotification } = useNotifications("student");
	const studentDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "A student",
		[]
	);

	const mentorSlug = Number(useParams()["last-selected"]);

	const filtered = React.useMemo<Person[]>(() => {
		const q = search.trim().toLowerCase();
		if (!q) {
			return mentors;
		}
		return mentors.filter(
			(p) => p.name.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q)
		);
	}, [search]);

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
								threads.find((thread) => thread.id === m.id) ?? m;
							const isRequested =
								Boolean(storedMentor.requestedCommunication) &&
								!storedMentor.hasConnected;

							return (
								<Card
									key={m.id}
									className="hover:shadow-md transition-all flex flex-col justify-between">
									<div>
										<CardHeader className="flex items-center space-x-3">
											<img
												src={profilePicture}
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
												const nowStr = new Date().toLocaleString();
												const nowUnix = Date.now();

												setThreads((prev) =>
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

												const selectedMentor = mentors.find(
													(mentor) => mentor.id === m.id
												);
												if (selectedMentor) {
													selectedMentor.requestedCommunication = true;
													selectedMentor.lastMessage = nowStr;
													selectedMentor.lastMessageUnix = nowUnix;
												}

												addStudentNotification({
													message: `Chat request sent to ${m.name}.`,
													type: "request",
													contextId: m.id,
												});
												pushNotificationToOtherRole(
													"mentor",
													`${studentDisplayName} requested to connect with you.`,
													{
														type: "request",
														contextId: m.id,
													}
												);

												navigate(`/student/home/messages/${m.id}`);
											}}
											aria-label={`Start chat with ${m.name}`}
											className="gap-2"
											disabled={isRequested}>
											<MessageCircle className="h-4 w-4" />
											{isRequested ? "Requested" : "Request Chat"}
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
