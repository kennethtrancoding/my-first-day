import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import StudentDashboardLayout from "@/features/student/components/StudentDashboardLayout";
import { upcomingEvents } from "@/constants";
import { useNavigate } from "react-router-dom";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import { type MentorMatch, matchMentorsForStudent } from "@/utils/mentorMatching";
import { useTeacherClubs } from "@/hooks/useTeacherCollections";
import { useCurrentAccount } from "@/hooks/useCurrentAccount";

function MatchedMentorList({ matches }: { matches: MentorMatch[] }) {
	const navigate = useNavigate();

	if (matches.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				Add your grade and interests in Settings to see mentor suggestions.
			</p>
		);
	}

	const people = () => {
		return matches.map(({ mentor }) => (
			<div key={mentor.id} className="flex justify-between items-center">
				<div className="flex gap-1 my-2">
					<img
						src={placeholderProfile}
						alt="Peer mentor avatar"
						className="rounded-full w-12 h-12 mb-4 mr-3"
					/>
					<div className="flex flex-col">
						<div className="flex flex-row gap-2 items-baseline">
							<p className="font-medium text-lg">{mentor.name}</p>
							{mentor.grade && (
								<p className="text-sm text-muted-foreground">
									{mentor.grade}th Grade
								</p>
							)}
						</div>
						<p className="text-sm text-muted-foreground line-clamp-1">{mentor.bio}</p>
					</div>
				</div>
				<Button onClick={() => navigate(`/student/home/messages/${mentor.id}/`)}>
					Chat Now <ArrowRight size={16} className="ml-2" />
				</Button>
			</div>
		));
	};
	return <div className="flex flex-col gap-4">{people()}</div>;
}

export default function StudentDashboardPage() {
	const navigate = useNavigate();
	const { account } = useCurrentAccount();

	const profileInterests = React.useMemo(() => {
		if (Array.isArray(account?.profile?.interests)) {
			return account.profile.interests;
		}
		return [] as string[];
	}, [account]);

	const storedMatches = React.useMemo(() => {
		if (Array.isArray(account?.profile?.matchedMentorIds)) {
			return account.profile.matchedMentorIds;
		}
		return [] as MentorMatch[];
	}, [account]);

	const mentorMatches = React.useMemo(() => {
		if (!account) {
			return [] as MentorMatch[];
		}
		const calculated = matchMentorsForStudent(
			{
				grade: account.profile?.grade,
				interests: profileInterests,
			},
			{ limit: 1 }
		);
		return calculated.length ? calculated : storedMatches;
	}, [account, profileInterests, storedMatches]);

	const [clubs] = useTeacherClubs();
	const featuredClubs = React.useMemo(() => clubs.filter((club) => club.featured), [clubs]);

	return (
		<StudentDashboardLayout activePage="home">
			<div className="grid gap-6 min-h-[calc(100vh-12rem)] lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr]">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>
							Meet your peer mentor
							{mentorMatches.length > 1 && "s"}!
						</CardTitle>
					</CardHeader>
					<CardContent>
						<MatchedMentorList matches={mentorMatches} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Upcoming Events</CardTitle>
						<CardDescription>Get involved and meet new friends.</CardDescription>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[150px]">
							<div className="space-y-3 pr-4">
								{upcomingEvents.map((event) => (
									<div key={event.id} className="p-3 bg-muted rounded-lg">
										<p className="font-medium">{event.title}</p>
										<p className="text-sm text-muted-foreground">
											{event.time} - {event.place}
										</p>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Clubs & Communities</CardTitle>
						<CardDescription>Explore groups you might want to join.</CardDescription>
					</CardHeader>
					<CardContent className="grid sm:grid-cols-2 gap-4">
						{featuredClubs.slice(0, 2).map((club) => {
							return (
								<button
									key={club.id}
									className="p-4 bg-muted rounded-lg text-left transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									onClick={() => navigate(`/student/home/clubs/${club.slug}/`)}>
									<p className="font-medium">{club.name}</p>
									<p className="text-xs text-muted-foreground">
										{club.description}
									</p>
								</button>
							);
						})}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Helpful Resources</CardTitle>
						<CardDescription>Find your way around campus.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							className="w-full"
							variant="outline"
							onClick={() => navigate("/student/home/resources/map/")}>
							Campus Map
						</Button>
						<Button
							className="w-full"
							variant="outline"
							onClick={() => navigate("/student/home/messages/mentors-directory/")}>
							Mentor Directory
						</Button>
						<Button
							className="w-full"
							variant="outline"
							onClick={() =>
								window.open(
									"https://resources.finalsite.net/images/v1756159775/wcusdorg/uq6hpinbifmfoojgtiyb/Parent_Student_Handbook_2025-26_FINAL_-English_07-17-2025_1.pdf"
								)
							}>
							Student Handbook
						</Button>
					</CardContent>
				</Card>
				{/*<Card className="lg:col-span-full lg:row-span-1 lg:h-full overflow-hidden border-none bg-gradient-to-r from-indigo-700 via-blue-600 to-sky-500 text-white">
					<CardContent className="flex h-full flex-col md:flex-row items-center justify-between gap-6 px-8 py-10">
						<div className="text-center md:text-left space-y-3 max-w-xl">
							<p className="text-xs uppercase tracking-[0.3em] text-white/70">
								Hollencrest Middle School
							</p>
							<h2 className="text-3xl md:text-4xl font-semibold leading-tight">
								Welcome, Huskies!
							</h2>
							<p className="text-sm md:text-base text-white/80">
								Stay informed, get connected, and celebrate everything happening on
								campus.
							</p>
							<div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 justify-center md:justify-start"></div>
						</div>
						<img
							src="../../src/assets/husky-logo.png"
							alt="Hollencrest Husky logo"
							className="w-32 md:w-40 lg:w-48 drop-shadow-xl"
						/>
					</CardContent>
				</Card>*/}
			</div>
		</StudentDashboardLayout>
	);
}
