import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function NotFoundPage() {
	const navigate = useNavigate();

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			navigate("/", { replace: true });
		}, 3000);

		return () => window.clearTimeout(timeoutId);
	}, [navigate]);

	return (
		<div className="min-h-screen w-full bg-gradient-hero flex flex-col items-center justify-center px-6 text-center">
			<div className="max-w-md bg-background/90 backdrop-blur shadow-lg rounded-lg p-8 space-y-4">
				<h1 className="text-5xl font-semibold tracking-tight">404</h1>
				<p className="text-lg text-muted-foreground">
					We could not find the page you were looking for. Redirecting you to the home page.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Button variant="default" onClick={() => navigate("/", { replace: true })}>
						Go now
					</Button>
					<Button variant="outline" asChild>
						<Link to="/">Back to landing</Link>
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">
					If the redirect does not happen automatically, use one of the buttons above.
				</p>
			</div>
		</div>
	);
}

export default NotFoundPage;
