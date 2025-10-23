import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Search, Users } from "lucide-react";

import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { clubDirectory } from "@/constants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentEmail } from "@/utils/auth";

const MentorClubDirectoryPage = () => {
	const navigate = useNavigate();
	const currentEmail = React.useMemo(() => getCurrentEmail() || "guest-mentor", []);
	const storagePrefix = React.useMemo(
		() => `user:${currentEmail}:mentorClubs`,
		[currentEmail]
	);
	const [searchTerm, setSearchTerm] = useStoredState<string>(
		`${storagePrefix}:searchTerm`,
		""
	);
	const [selectedCategory, setSelectedCategory] = useStoredState<string>(
		`${storagePrefix}:selectedCategory`,
		"All"
	);

	const categories = React.useMemo(() => {
		const unique = new Set(clubDirectory.map((club) => club.category));
		return ["All", ...Array.from(unique)];
	}, []);

	const filteredClubs = React.useMemo(() => {
		const normalizedQuery = searchTerm.trim().toLowerCase();

		return clubDirectory.filter((club) => {
			const matchesCategory =
				selectedCategory === "All" || club.category === selectedCategory;

			if (!matchesCategory) {
				return false;
			}

			if (!normalizedQuery) {
				return true;
			}

			const searchableContent = [
				club.name,
				club.description,
				club.longDescription,
				club.tags?.join(" ") ?? "",
				club.advisor,
				club.location,
			]
				.join(" ")
				.toLowerCase();

			return searchableContent.includes(normalizedQuery);
		});
	}, [searchTerm, selectedCategory]);

	return (
		<MentorDashboardLayout activePage="clubs">
			<div className="flex-1 p-8 h-full">
				<div className="flex flex-col gap-4 pb-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h1 className="text-2xl font-bold">Club Directory</h1>
							<p className="text-muted-foreground text-sm">
								Discover clubs your mentees might love and message advisors directly.
							</p>
						</div>
						<Button
							variant="ghost"
							onClick={() => navigate(-1)}
							aria-label="Back to clubs overview"
							className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							<span className="hidden sm:inline">Back to Clubs</span>
							<span className="sm:hidden">Back</span>
						</Button>
					</div>

					<div className="relative w-full sm:max-w-md">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Search clubs, advisors, or activities"
							className="pl-10"
							aria-label="Search clubs"
						/>
					</div>
					<Tabs
						value={selectedCategory}
						onValueChange={setSelectedCategory}
						className="w-full sm:w-auto">
						<TabsList className="flex w-full flex-wrap gap-2 border border-border bg-muted/60 p-1 h-auto sm:justify-center">
							{categories.map((category) => (
								<TabsTrigger
									key={category}
									value={category}
									className="rounded-full border border-transparent px-4 py-2 text-sm transition data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
									{category}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>

				<ScrollArea className="h-[calc(100vh-18rem)] pr-2">
					{filteredClubs.length ? (
						<div className="grid gap-6 pb-2 md:grid-cols-2 xl:grid-cols-3">
							{filteredClubs.map((club) => (
								<Card
									key={club.id}
									className="group flex h-full cursor-pointer flex-col overflow-hidden transition-smooth hover:shadow-student-lg"
									onClick={() => navigate(`/mentor/home/clubs/${club.slug}/`)}>
									<div className="relative h-40 w-full overflow-hidden">
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
										<CardDescription className="line-clamp-2">
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
										{club.tags?.length ? (
											<div className="flex flex-wrap gap-2 pt-2">
												{club.tags.map((tag) => (
													<Badge
														key={tag}
														variant="outline"
														className="border-muted text-xs">
														{tag}
													</Badge>
												))}
											</div>
										) : null}
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
					) : (
						<div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/40 p-12 text-center">
							<div
								<h2 className="text-lg font-semibold">No clubs match those filters</h2>
								<p className="mt-2 text-sm text-muted-foreground">
									Try adjusting your search or selecting a different category to see
									more clubs.
								</p>
							</div>
						</div>
					)}
				</ScrollArea>
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorClubDirectoryPage;
