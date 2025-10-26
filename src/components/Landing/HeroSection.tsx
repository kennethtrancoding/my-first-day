import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageSquare, Users, Map, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroStudents from "@/assets/hero-students.jpg";

const highlights = [
	{ icon: MessageSquare, label: "Chat with mentors who have walked the halls" },
	{ icon: Users, label: "Browse clubs and pick your first meet-up" },
	{ icon: Map, label: "See where everything is before the first bell" },
];

const HeroSection = () => {
	return (
		<section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-hero pt-24 pb-12 md:pt-32">
			<div className="absolute inset-0 bg-black/25" />
			<div
				className="pointer-events-none absolute -top-32 -left-20 h-80 w-80 rounded-full bg-white/15 blur-3xl"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-accent/30 blur-3xl"
				aria-hidden="true"
			/>

			<div className="container relative z-10 mx-auto px-4">
				<div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
					<div className="space-y-10 text-white">
						<div className="space-y-4">
							<h1 className="text-5xl font-bold leading-tight lg:text-6xl">
								Ready for your
								<span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-amber-200 bg-clip-text text-transparent leading-tight">
									first day of school?
								</span>
							</h1>
							<p className="text-xl leading-relaxed text-white/90 lg:text-2xl">
								Organize your first weeks, meet mentors, explore clubs, and learn
								the campus before the bell rings.
							</p>
						</div>

						<div className="flex flex-col gap-4 pt-2 sm:flex-row">
							<Button variant="hero" size="lg" className="group" asChild>
								<Link to="/sign-up/">
									Get Started
									<ArrowRight className="ml-2" size={20} />
								</Link>
							</Button>
							<Button
								variant="secondary"
								size="lg"
								className="border-white/20 bg-white/10 text-white hover:bg-white/20"
								asChild>
								<Link to="/log-in/">Log In</Link>
							</Button>
						</div>

						<div className="space-y-3 text-sm text-white/80">
							{highlights.map(({ icon: Icon, label }) => (
								<div key={label} className="flex items-center gap-3">
									<span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
										<Icon className="h-5 w-5" />
									</span>
									{label}
								</div>
							))}
						</div>
					</div>

					<div className="relative space-y-6">
						<Card className="overflow-hidden border-none bg-white/95 shadow-student-lg backdrop-blur-sm">
							<figure>
								<img
									src={heroStudents}
									alt="Students walking toward the main courtyard before morning classes"
									className="h-full w-full object-cover"
								/>
								<figcaption className="sr-only">
									Photo of Hollencrest Middle School students heading toward the
									courtyard.
								</figcaption>
							</figure>
						</Card>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
