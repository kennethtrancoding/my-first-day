import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { createMainResources, createHelpAndSupport } from "@/utils/data";
import { useStoredState } from "@/hooks/useStoredState";
import { filterResourcesByAudience, type TeacherResource } from "@/utils/teacherData";

const MentorResourcesPage = () => {
	const navigate = useNavigate();
	const mainResources = createMainResources(navigate, "mentor");
	const helpAndSupport = createHelpAndSupport(navigate, "mentor");
	const [sharedResources] = useStoredState<TeacherResource[]>("teacher:resources", []);
	const mentorFacing = filterResourcesByAudience(sharedResources, "mentor");

	return (
		<MentorDashboardLayout activePage="resources">
			<div className="container mx-auto px-4 space-y-8">
				<div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
					{mainResources.map((resource) => (
						<Card
							key={resource.title}
							className="hover:shadow-lg transition-shadow h-full flex flex-col">
							<CardHeader className="flex flex-row items-center space-y-0 pb-2">
								<resource.icon className="h-6 w-6 text-secondary mr-3" />
								<CardTitle className="text-lg">{resource.title}</CardTitle>
							</CardHeader>

							<CardContent className="flex flex-col gap-4 flex-1">
								<CardDescription>{resource.description}</CardDescription>
								<Button
									className="mt-auto w-full"
									onClick={() => resource.onclick()}>
									{resource.buttonText}
									<ArrowRight size={16} className="ml-2" />
								</Button>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
					{helpAndSupport.map((resource) => (
						<Card
							key={resource.title}
							className="hover:shadow-lg transition-shadow h-full flex flex-col">
							<CardHeader className="flex flex-row items-center space-y-0 pb-2">
								<resource.icon className="h-6 w-6 text-secondary mr-3" />
								<CardTitle className="text-lg">{resource.title}</CardTitle>
							</CardHeader>

							<CardContent className="flex flex-col gap-4 flex-1">
								<CardDescription>{resource.description}</CardDescription>
								<Button
									variant="secondary"
									className="mt-auto w-full"
									onClick={() => resource.onclick()}>
									{resource.buttonText}
									<ArrowRight size={16} className="ml-2" />
								</Button>
							</CardContent>
						</Card>
					))}
				</div>

				{mentorFacing.length > 0 && (
					<div className="space-y-4">
						<div>
							<h2 className="text-xl font-semibold">Shared by teachers</h2>
							<p className="text-sm text-muted-foreground">
								Keep peer mentors aligned with the latest staff resources.
							</p>
						</div>
						<div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
							{mentorFacing.map((resource) => (
								<Card key={resource.id} className="flex flex-col">
									<CardHeader className="space-y-2">
										<div className="flex items-center justify-between gap-2">
											<CardTitle className="text-lg">
												{resource.title}
											</CardTitle>
											<Badge variant="outline">Shared</Badge>
										</div>
										<CardDescription>
											Updated{" "}
											{new Date(resource.updatedAt).toLocaleDateString()}
										</CardDescription>
									</CardHeader>
									<CardContent className="flex flex-col gap-4 flex-1">
										<p className="text-sm text-muted-foreground">
											{resource.description}
										</p>
										<Button
											variant="secondary"
											className="mt-auto"
											onClick={() =>
												window.open(
													resource.url,
													"_blank",
													"noopener,noreferrer"
												)
											}>
											Open resource <ArrowRight size={16} className="ml-2" />
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorResourcesPage;
