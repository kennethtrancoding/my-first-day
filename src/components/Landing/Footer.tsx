import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import clearLocalStorage from "@/utils/storage";

const LandingFooter = () => {
	return (
		<footer className="flex flex-col items-center justify-center gap-6 border-t bg-background py-10">
			<div className="container mx-auto flex flex-col gap-6 px-4 text-center sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-baseline gap-3">
						<p className="text-lg font-semibold text-foreground">My First Day</p>
						<p className="text-sm text-muted-foreground">
							For new students finding their way.
						</p>
					</div>
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

			<div className="mt-2 space-y-1 text-center text-md">
				<p className="text-muted-foreground">
					Created by Kenneth Tran for the 2025 Congressional App Challenge.
				</p>
				<Link to="https://kennethtrancoding.com/">kennethtrancoding.com</Link>
			</div>

			<Button variant="destructive" onClick={clearLocalStorage}>
				Reset all data
			</Button>
		</footer>
	);
};

export default LandingFooter;
