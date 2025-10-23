import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { createMainResources, createHelpAndSupport } from "@/constants";

const MentorResourcesPage = () => {
	const navigate = useNavigate();
	const mainResources = createMainResources(navigate, "mentor");
	const helpAndSupport = createHelpAndSupport(navigate, "mentor");

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
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorResourcesPage;
