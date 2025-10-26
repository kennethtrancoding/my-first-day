import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Mail, MapPin, Users } from "lucide-react";
import StudentDashboardLayout from "@/features/student/components/StudentDashboardLayout";
import { useTeacherClubs } from "@/hooks/useTeacherCollections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formatRoomNumber = (room?: string) => {
	if (!room) {
		return null;
	}

	return /^\d/.test(room) ? `Room ${room}` : room;
};

const StudentClubDetailPage = () => {
	const navigate = useNavigate();
	const { clubSlug } = useParams<{ clubSlug: string }>();

	const [clubs] = useTeacherClubs();
	const club = React.useMemo(
		() => clubs.find((item) => item.slug === clubSlug),
		[clubSlug, clubs]
	);

	React.useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [clubSlug]);

	if (!club) {
		return (
			<StudentDashboardLayout activePage="clubs">
				<div className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-20 text-center">
					<h1 className="text-3xl font-semibold">We couldn't find that club</h1>
					<p className="text-muted-foreground">
						The club you were looking for may have been updated or moved. Head back to
						the clubs directory to keep exploring.
					</p>
					<Button onClick={() => navigate("/student/home/clubs/")}>
						Return to Clubs
					</Button>
				</div>
			</StudentDashboardLayout>
		);
	}

	const openAdvisorMessages = () => {
		navigate("/student/home/messages/");
	};

	return (
		<StudentDashboardLayout activePage="clubs">
			<div className="mx-auto flex max-w-6xl flex-col gap-8">
				<Button
					variant="ghost"
					size="sm"
					className="w-fit -ml-2"
					onClick={() => navigate("/student/home/clubs")}
					aria-label="Back to clubs">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
					<div className="relative h-64 w-full">
						<img
							src={club.image}
							alt={`${club.name} highlight`}
							className="h-full w-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-background via-background/20" />
						<div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3 text-card-foreground">
							<div className="flex flex-wrap items-center gap-3">
								<Badge
									variant="secondary"
									className="bg-background/80 text-foreground backdrop-blur">
									{club.category}
								</Badge>
								<Badge className="bg-background/80 text-foreground backdrop-blur">
									{club.members} members
								</Badge>
							</div>
							<h1 className="text-3xl font-bold text-foreground drop-shadow-lg">
								{club.name}
							</h1>
						</div>
					</div>

					<div className="grid gap-8 p-8 lg:grid-cols-[2fr,1fr]">
						<section className="space-y-8">
							<div className="space-y-4">
								<h2 className="text-2xl font-semibold">About the Club</h2>
								<p className="text-muted-foreground leading-relaxed">
									{club.longDescription}
								</p>
							</div>

							<div className="space-y-4">
								<h3 className="text-xl font-semibold">What you'll do</h3>
								<ul className="grid gap-3 sm:grid-cols-2">
									{club.highlights?.map((highlight) => (
										<li
											key={highlight}
											className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
											{highlight}
										</li>
									))}
								</ul>
							</div>

							{club.requirements && (
								<div className="space-y-3 rounded-2xl border bg-muted/60 p-6">
									<h3 className="text-lg font-semibold">How to join</h3>
									<p className="text-sm text-muted-foreground">
										{club.requirements}
									</p>
								</div>
							)}
						</section>

						<aside className="space-y-6">
							<Card>
								<CardHeader className="pb-4">
									<CardTitle>Quick Facts</CardTitle>
									<CardDescription>
										Key details for meetings and staying connected.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 text-sm">
									<div className="flex items-start gap-3">
										<MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium">Location</p>
											<p className="text-muted-foreground">{club.location}</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium">Next meeting</p>
											<p className="text-muted-foreground">
												{club.nextMeeting}
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium">Club Advisor</p>
											<p className="text-muted-foreground">{club.advisor}</p>
											{(club.advisorProfile?.department ||
												club.advisorProfile?.roomNumber) && (
												<p className="text-xs text-muted-foreground">
													{club.advisorProfile?.department}
													{club.advisorProfile?.department &&
													club.advisorProfile?.roomNumber
														? " • "
														: ""}
													{formatRoomNumber(
														club.advisorProfile?.roomNumber
													)}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-start gap-3">
										<Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium">Contact</p>
											<Button
												variant="link"
												className="h-auto p-0 text-left text-muted-foreground"
												onClick={openAdvisorMessages}>
												{club.contactEmail}
											</Button>
										</div>
									</div>
									<Separator />
									<Button className="w-full" onClick={openAdvisorMessages}>
										Message the Advisor
									</Button>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-4">
									<CardTitle>Upcoming Activities</CardTitle>
									<CardDescription>
										Jump into the next meeting or event.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									{club.upcomingActivities?.map((activity) => (
										<div key={activity.title} className="rounded-xl border p-4">
											<p className="text-sm font-medium">{activity.title}</p>
											<p className="text-xs text-muted-foreground">
												{activity.date}
											</p>
											<p className="mt-1 text-sm text-muted-foreground">
												{activity.description}
											</p>
										</div>
									))}
									{!club.upcomingActivities?.length && (
										<p className="text-sm text-muted-foreground">
											Check back soon—new events are on the way!
										</p>
									)}
								</CardContent>
							</Card>
						</aside>
					</div>
				</div>
			</div>
		</StudentDashboardLayout>
	);
};

export default StudentClubDetailPage;
