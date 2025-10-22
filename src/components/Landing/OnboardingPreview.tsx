import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Users, BookOpen, MessageSquare } from "lucide-react";

const OnboardingPreview = () => {
	const onboardingSteps = [
		{
			id: 1,
			title: "Create Your Profile",
			description: "Tell us about your interests, support needs, and academic goals.",
			icon: Users,
			completed: true,
		},
		{
			id: 2,
			title: "Match with a Mentor",
			description: "Browse the directory to connect with teachers or peer guides you trust.",
			icon: MessageSquare,
			completed: false,
		},
		{
			id: 3,
			title: "Tour Your Dashboard",
			description:
				"Preview events, clubs, and the campus map so you know what's waiting inside.",
			icon: BookOpen,
			completed: false,
		},
	];

	const mentorFeatures = [
		"Search teachers and peer mentors by subject or grade level",
		"See availability, room numbers, and quick bios",
		"Start a chat straight from the dashboard",
		"Share resources, links, and campus tips",
		"Receive follow-up reminders when mentors respond",
	];

	return (
		<section className="py-16 bg-muted/30">
			<div className="container mx-auto px-4">
				<div className="text-center mb-12">
					<h2 className="text-4xl font-bold mb-4">
						Let's connect with your new friends!
					</h2>
				</div>

				<div className="grid lg:grid-cols-2 gap-12 items-center">
					<div className="space-y-8">
						<div>
							<h3 className="text-2xl font-semibold mb-6">Your Onboarding Journey</h3>
							<div className="space-y-4">
								{onboardingSteps.map((step) => (
									<Card
										key={step.id}
										className={`transition-smooth ${
											step.completed ? "bg-secondary/20 border-secondary" : ""
										}`}>
										<CardContent className="p-6">
											<div className="flex items-start gap-4">
												<div
													className={`p-3 rounded-full ${
														step.completed
															? "bg-secondary text-secondary-foreground"
															: "bg-muted"
													}`}>
													{step.completed ? (
														<CheckCircle2 size={24} />
													) : (
														<step.icon size={24} />
													)}
												</div>
												<div className="flex-1">
													<h4 className="font-semibold mb-2">
														{step.title}
													</h4>
													<p className="text-muted-foreground text-sm">
														{step.description}
													</p>
												</div>
												{step.completed && (
													<Badge variant="secondary">Complete</Badge>
												)}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>

						<Button
							variant="hero"
							size="lg"
							className="w-full sm:w-auto"
							onClick={() => (window.location.href = "/onboarding/")}>
							Start Your Journey
							<ArrowRight size={20} className="ml-2" />
						</Button>
					</div>

					<Card className="overflow-hidden bg-gradient-card shadow-student-lg">
						<div className="relative h-40 w-full overflow-hidden bg-muted">
							<img
								src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80"
								alt="Mentor welcoming a new student with a laptop open to the onboarding dashboard"
								className="h-full w-full object-cover opacity-90"
								loading="lazy"
							/>
							<span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								In-app preview
							</span>
						</div>
						<CardHeader className="space-y-2">
							<CardTitle className="flex items-center gap-2">
								<MessageSquare className="text-accent" size={24} />
								Connect with an Experienced Mentor
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								Send a message, review availability, and plan your first meeting
								without leaving the app.
							</p>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="bg-accent/10 p-4 rounded-lg">
								<h4 className="font-semibold mb-2 text-accent">
									Featured: Sarah Chen
								</h4>
								<p className="text-sm text-muted-foreground mb-3">
									Senior, Student Council President. Available to help with course
									selection and extracurricular advice.
								</p>
								<div className="flex gap-2">
									<Badge variant="outline">Math Tutor</Badge>
									<Badge variant="outline">Leadership</Badge>
								</div>
							</div>

							<div>
								<h4 className="font-semibold mb-4">What Mentors Offer:</h4>
								<div className="space-y-3">
									{mentorFeatures.map((feature, index) => (
										<div key={index} className="flex items-center gap-3">
											<CheckCircle2 className="text-secondary" size={16} />
											<span className="text-sm">{feature}</span>
										</div>
									))}
								</div>
							</div>

							<Button
								variant="secondary"
								className="w-full"
								onClick={() =>
									(window.location.href = "/home/messages/mentors-directory/")
								}>
								Connect with Mentors
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
};

export default OnboardingPreview;
