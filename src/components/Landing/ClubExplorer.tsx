import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTeacherClubs } from "@/hooks/useTeacherCollections";

const ClubExplorer = () => {
	const [clubs] = useTeacherClubs();
	const featuredClubs = React.useMemo(
		() => clubs.filter((club) => club.featured),
		[clubs]
	);

	return (
		<section className="py-16 bg-background min-h-[100vh]">
			<div className="container mx-auto px-4">
				<div className="text-center mb-12">
					<h2 className="text-4xl font-bold mb-4">Discover your community</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Find your place by joining clubs, connecting with fellow students, and
						building lasting friendships at your new school.
					</p>
				</div>

				{featuredClubs.length === 0 ? (
					<Card className="border-dashed mb-12">
						<CardContent className="p-8 text-center text-muted-foreground">
							Club highlights will appear here once teachers feature a few standouts.
						</CardContent>
					</Card>
				) : (
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
						{featuredClubs.map((club) => (
							<Card
								key={club.id}
								className="hover:shadow-student-lg transition-smooth group cursor-pointer">
								<CardHeader className="pb-3">
									<div className="relative mb-4 h-32 w-full overflow-hidden rounded-lg">
										<img
											src={club.image}
											alt={`${club.name} highlight`}
											className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
											loading="lazy"
										/>
										<div
											className={`absolute inset-0 ${club.color} opacity-60 mix-blend-multiply`}
											aria-hidden="true"
										/>
										<div className="absolute inset-0 flex items-center justify-center text-white">
											<Users size={40} className="drop-shadow-sm" />
										</div>
									</div>
									<CardTitle className="text-lg">{club.name}</CardTitle>
									<Badge variant="outline" className="w-fit">
										{club.category}
									</Badge>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-sm text-muted-foreground">{club.description}</p>

									<div className="space-y-2 text-xs">
										<div className="flex items-center gap-2 text-muted-foreground">
											<Users size={14} />
											<span>{club.members} members</span>
										</div>
										<div className="flex items-center gap-2 text-muted-foreground">
											<Calendar size={14} />
											<span>{club.nextMeeting}</span>
										</div>
										<div className="flex items-center gap-2 text-muted-foreground">
											<MapPin size={14} />
											<span>{club.location}</span>
										</div>
									</div>

									<Button variant="outline" size="sm" className="w-full " asChild>
										<Link to={`/student/home/clubs/${club.slug}/`}>
											Learn More
											<ArrowRight size={14} className="ml-2" />
										</Link>
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				<div className="text-center">
					<Button variant="hero" size="lg" asChild>
						<Link to="/student/home/clubs/directory/">
							Explore All Clubs
							<ArrowRight size={20} className="ml-2" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
};

export default ClubExplorer;
