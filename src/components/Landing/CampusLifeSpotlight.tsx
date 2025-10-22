import { Card, CardContent } from "@/components/ui/card";

type SpotlightCard = {
	title: string;
	description: string;
	image: string;
	alt: string;
};

const spotlightCards: SpotlightCard[] = [
	{
		title: "Morning Check-in",
		description: "Get a quick overview of your schedule, messages, and campus alerts before homeroom.",
		image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=900&q=80",
		alt: "Student checking school schedule on a tablet in the hallway",
	},
	{
		title: "Clubs in Action",
		description: "See snapshots from the robotics lab, art studio, and community garden to find your fit.",
		image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80",
		alt: "Students collaborating on a robotics project around a table",
	},
	{
		title: "Mentor Meetups",
		description: "Preview where mentors host office hours and the cozy corners perfect for study sessions.",
		image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80",
		alt: "Small group of students working with a mentor in a library space",
	},
];

const CampusLifeSpotlight = () => {
	return (
		<section className="bg-background py-16">
			<div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-[1.1fr_0.9fr]">
				<div className="space-y-6">
					<span className="inline-flex rounded-full bg-secondary/20 px-3 py-1 text-sm font-medium text-secondary">
						Campus Life
					</span>
					<h2 className="text-4xl font-bold leading-tight text-foreground">
						See what your first week really looks like
					</h2>
					<p className="text-lg text-muted-foreground">
						Tour the classrooms, hangout spots, and welcome events before you arrive. Each photo
						is a real moment captured by students who were new just like you.
					</p>
					<ul className="space-y-3 text-muted-foreground">
						<li className="flex gap-3">
							<span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden="true" />
							Follow curated galleries to learn where to grab lunch, join study groups, and meet mentors.
						</li>
						<li className="flex gap-3">
							<span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
							Save favorite locations and bookmark events to build your personalized first-week plan.
						</li>
						<li className="flex gap-3">
							<span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
							Share your own photos once you join and help next year's students feel at home faster.
						</li>
					</ul>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					{spotlightCards.map((card, index) => (
						<Card
							key={card.title}
							className={`group overflow-hidden border-none bg-muted/40 shadow-student-md transition-smooth hover:-translate-y-1 hover:shadow-student-lg ${
								index === 0 ? "sm:col-span-2" : ""
							}`}>
							<CardContent className="flex h-full flex-col gap-4 p-0">
								<div className="overflow-hidden bg-muted">
									<img
										src={card.image}
										alt={card.alt}
										loading="lazy"
										className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
									/>
								</div>
								<div className="space-y-2 px-5 pb-5 pt-2">
									<h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
									<p className="text-sm text-muted-foreground">{card.description}</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
};

export default CampusLifeSpotlight;
