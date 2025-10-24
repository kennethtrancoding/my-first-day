import { Users, ArrowRight, Calendar, MapPin } from "lucide-react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { featuredClubs } from "@/constants";
import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { useNavigate } from "react-router-dom";

const MentorClubListPage = () => {
	const navigate = useNavigate();

	return (
		<MentorDashboardLayout activePage="clubs">
			<div className="container mx-auto px-4">
				<div className="grid gap-6 mb-12 md:grid-cols-2 xl:grid-cols-3">
					{featuredClubs.map((club) => (
						<Card
							key={club.id}
							className="group flex h-full cursor-pointer flex-col overflow-hidden transition-smooth hover:shadow-student-lg"
							onClick={() => navigate(`/mentor/home/clubs/${club.slug}/`)}>
							<div className="relative h-36 w-full overflow-hidden">
								<img
									src={club.image}
									alt={`${club.name} highlight`}
									className="h-full w-full object-cover"
									loading="lazy"
								/>

								<Badge
									variant="secondary"
									className="absolute left-4 top-4 bg-background/80 text-foreground backdrop-blur-sm">
									{club.category}
								</Badge>
							</div>
							<CardHeader className="space-y-2">
								<CardTitle className="text-lg">{club.name}</CardTitle>
								<CardDescription className="text-sm line-clamp-2">
									{club.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									<span>{club.members} members</span>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									<span>{club.nextMeeting}</span>
								</div>
								<div className="flex items-center gap-2">
									<MapPin className="h-4 w-4" />
									<span>{club.location}</span>
								</div>
							</CardContent>
							<CardFooter className="mt-auto flex flex-wrap gap-2">
								<Button
									size="sm"
									onClick={(event) => {
										event.stopPropagation();
										navigate(`/mentor/home/clubs/${club.slug}/`);
									}}>
									View details
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>

				<div className="text-center">
					<Button
						variant="hero"
						size="lg"
						onClick={() => navigate("/mentor/home/clubs/directory/")}>
						Explore All Clubs
						<ArrowRight size={20} className="ml-2" />
					</Button>
				</div>
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorClubListPage;
