import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, MessageSquare, Map } from "lucide-react";
import { Link } from "react-router-dom";

type FeatureConfig = {
	title: string;
	description: string;
	icon: typeof LayoutDashboard;
	actionLabel: string;
	href: string;
	gradient: string;
	backgroundPosition: string;
	illustrationLabel: string;
	image: string;
};

const features: FeatureConfig[] = [
	{
		title: "Simple Dashboard",
		description: "Check upcoming events, reminders, and quick shortcuts in seconds.",
		icon: LayoutDashboard,
		actionLabel: "See Dashboard",
		href: "/student/home/",
		gradient: "from-primary/35 via-primary/15 to-secondary/30",
		backgroundPosition: "center top",
		illustrationLabel:
			"Preview of the dashboard tiles with upcoming events and mentor check-ins highlighted",
		image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
	},
	{
		title: "Mentor Check-ins",
		description: "Send a quick hello and get responses from staff or peer mentors.",
		icon: MessageSquare,
		actionLabel: "Open Messages",
		href: "/student/home/messages/mentors-directory/",
		gradient: "from-secondary/35 via-accent/25 to-primary/25",
		backgroundPosition: "center",
		illustrationLabel:
			"Messaging preview showing a mentor welcoming a new student to Hollencrest",
		image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80",
	},
	{
		title: "Campus Snapshot",
		description: "Tour hallways, labs, and hangout spots with the interactive map.",
		icon: Map,
		actionLabel: "View Map",
		href: "/student/home/resources/map/",
		gradient: "from-accent/35 via-primary/20 to-secondary/20",
		backgroundPosition: "center bottom",
		illustrationLabel:
			"Stylized campus map with key buildings and outdoor meeting areas highlighted",
		image: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1200&q=80",
	},
];

const LandingFeatureShowcase = () => {
	return (
		<section className="relative overflow-hidden bg-muted/20 py-16">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 w-2/3 rounded-full bg-gradient-to-r from-primary/25 via-secondary/25 to-accent/30 blur-3xl"
				aria-hidden="true"
			/>
			<div className="container relative mx-auto px-4">
				<div className="mx-auto mb-10 max-w-2xl text-center">
					<h2 className="text-3xl font-semibold text-foreground">
						Get ready in three quick steps
					</h2>
					<p className="mt-3 text-base text-muted-foreground">
						Vibrant previews and simple actions to carry you from sign-up to your first
						day.
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					{features.map(
						({
							title,
							description,
							icon: Icon,
							actionLabel,
							href,
							gradient,
							backgroundPosition,
							illustrationLabel,
							image,
						}) => (
							<Card
								key={title}
								className="relative flex h-full flex-col overflow-hidden border-none shadow-student-lg">
								<div
									className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`}
									aria-hidden="true"
								/>
								<CardHeader className="relative space-y-3 text-white">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
										<Icon className="h-6 w-6" />
									</div>
									<CardTitle className="text-xl">{title}</CardTitle>
									<CardDescription className="text-sm text-white/85">
										{description}
									</CardDescription>
								</CardHeader>
								<CardContent className="relative mt-auto flex flex-col gap-5">
									<div className="relative overflow-hidden rounded-xl border border-white/30 shadow-student-md">
										<img
											src={image}
											alt={illustrationLabel}
											className="h-36 w-full object-cover opacity-95"
											style={{ objectPosition: backgroundPosition }}
											loading="lazy"
										/>
										<div
											className="absolute inset-0 bg-gradient-to-br from-black/25 via-black/10"
											aria-hidden="true"
										/>
									</div>
									<Button
										variant="outline"
										className="w-full border-white/60 bg-white/85 text-foreground hover:bg-white"
										asChild>
										<Link to={href}>
											{actionLabel}
											<ArrowRight className="ml-2 h-4 w-4" />
										</Link>
									</Button>
								</CardContent>
							</Card>
						)
					)}
				</div>
			</div>
		</section>
	);
};

export default LandingFeatureShowcase;
