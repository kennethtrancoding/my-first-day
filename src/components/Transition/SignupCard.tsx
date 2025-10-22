import {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import GoogleSignInButton from "@/components/ui/googleSignIn";
import { Link, useNavigate } from "react-router-dom";
import { FormEvent, KeyboardEvent, useRef } from "react";

function SignupCard() {
	const navigate = useNavigate();
	const passwordRef = useRef<HTMLInputElement>(null);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		navigate("/verification/");
	}

	function handleEmailKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== "Enter") return;

		event.preventDefault();
		passwordRef.current?.focus();
	}

	function handlePasswordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== "Enter") return;

		event.preventDefault();
		event.currentTarget.form?.requestSubmit();
	}

	return (
		<div className="w-screen h-screen flex items-center justify-center backdrop-blur-[3px]  bg-gradient-hero ">
			<Card className="w-full max-w-sm">
				<form onSubmit={handleSubmit} className="flex h-full flex-col">
					<CardHeader>
						<CardTitle>Sign Up</CardTitle>
						<CardDescription>
							Enter your email and create a password or use Google to create an account.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<GoogleSignInButton type="signup" />
						<hr />
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="m@example.com"
								onKeyDown={handleEmailKeyDown}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								ref={passwordRef}
								onKeyDown={handlePasswordKeyDown}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col">
						<Button className="w-full" type="submit">
							Sign Up
						</Button>
						<Link
							className="text-sm text-muted-foreground hover:underline text-center mt-2"
							to="/log-in/">
							Log into an existing account
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}

export default SignupCard;
