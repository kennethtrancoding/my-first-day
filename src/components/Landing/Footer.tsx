import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LandingFooter = () => {
	return (
		<footer className="border-t bg-background py-10">
			<div className="container mx-auto flex flex-col gap-6 px-4 text-center sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<p className="text-lg font-semibold text-foreground">
						Hollencrest Campus Companion
					</p>
					<p className="text-sm text-muted-foreground">
						Made for new Huskies finding their way.
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button variant="ghost" asChild>
						<Link to="/sign-up/">Create account</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link to="/log-in/">Log in</Link>
					</Button>
				</div>
			</div>
		</footer>
	);
};

export default LandingFooter;
