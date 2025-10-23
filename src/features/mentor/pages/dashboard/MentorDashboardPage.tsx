import { ArrowRight, MessageCircle, ClipboardList, Map as MapIcon, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { upcomingEvents, featuredClubs } from "@/constants";
import { students } from "@/people";

const MentorDashboardPage = () => {
	const navigate = useNavigate();

	const pendingStudents = students.filter((student) => !student.assignedToMentor);
	const activeStudents = students.filter((student) => student.assignedToMentor);

	return (
		<MentorDashboardLayout activePage="home">
			<div className="grid gap-6 min-h-[calc(100vh-12rem)] lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr]">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-start justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2">
								<ClipboardList className="h-5 w-5 text-primary" />
								Pending Student Requests
							</CardTitle>
							<CardDescription>
								Review new mentorship requests and welcome students who need
								support.
							</CardDescription>
						</div>
						<Badge variant="secondary">{pendingStudents.length} waiting</Badge>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						{pendingStudents.slice(0, 3).map((student) => (
							<div
								key={student.id}
								className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4 hover:bg-muted/60 transition-colors">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold">{student.name}</p>
										<p className="text-xs text-muted-foreground">
											Grade {student.grade} • Interested in mentorship
										</p>
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											navigate(`/mentor/home/messages/${student.id}`)
										}>
										Message
									</Button>
								</div>
								<p className="text-xs text-muted-foreground line-clamp-2">
									{student.bio}
								</p>
							</div>
						))}
						{pendingStudents.length === 0 && (
							<p className="text-sm text-muted-foreground">
								You're all caught up. New student requests will appear here as soon
								as they arrive.
							</p>
						)}
						<Button
							className="self-start"
							onClick={() => navigate("/mentor/home/requests/")}
							variant="default">
							Manage Requests <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Active Connections</CardTitle>
						<CardDescription>Students you're currently supporting.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{activeStudents.slice(0, 4).map((student) => (
								<div key={student.id} className="rounded-lg bg-muted/40 p-3">
									<p className="text-sm font-semibold">{student.name}</p>
									<p className="text-xs text-muted-foreground">
										Last update: {student.lastMessage}
									</p>
								</div>
							))}
							{activeStudents.length === 0 && (
								<p className="text-sm text-muted-foreground">
									Accept a request to see active mentees here.
								</p>
							)}
							<Button
								variant="outline"
								className="w-full"
								onClick={() => navigate("/mentor/home/messages/")}>
								Open Messages <MessageCircle className="h-4 w-4 ml-2" />
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Upcoming Events</CardTitle>
						<CardDescription>
							Recommend opportunities to your mentees and plan your visits.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[150px]">
							<div className="space-y-3 pr-4">
								{upcomingEvents.map((event) => (
									<div key={event.id} className="p-3 bg-muted rounded-lg">
										<p className="font-medium">{event.title}</p>
										<p className="text-sm text-muted-foreground">
											{event.time} • {event.place}
										</p>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Resource Library</CardTitle>
						<CardDescription>
							Share these go-to references with your mentees in a click.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							className="w-full"
							variant="outline"
							onClick={() => navigate("/mentor/home/resources/map/")}>
							<MapIcon className="mr-2 h-4 w-4" />
							Open Campus Map
						</Button>
						<Button
							className="w-full"
							variant="outline"
							onClick={() => navigate("/mentor/home/resources/")}>
							<BookOpen className="mr-2 h-4 w-4" />
							Browse Resources
						</Button>
					</CardContent>
				</Card>

				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle>Clubs & Advisors</CardTitle>
						<CardDescription>
							Highlight clubs that align with your mentees.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{featuredClubs.slice(0, 4).map((club) => (
							<button
								key={club.id}
								className="p-4 bg-muted rounded-lg text-left transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								onClick={() => navigate(`/mentor/home/clubs/${club.slug}/`)}>
								<p className="font-medium">{club.name}</p>
								<p className="text-xs text-muted-foreground line-clamp-2">
									{club.description}
								</p>
							</button>
						))}
					</CardContent>
				</Card>
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorDashboardPage;
