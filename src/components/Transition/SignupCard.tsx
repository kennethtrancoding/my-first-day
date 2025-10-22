import * as React from "react";
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
import { useEffect } from "react";
import GoogleSignInButton from "@/components/ui/googleSignIn";
import { useNavigate } from "react-router-dom";

function SignupCard() {
	useEffect(() => {
		const script = document.createElement("script");
		script.src = "https://apis.google.com/js/platform.js";
		script.async = true;
		script.defer = true;
		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, []);

	function handleLogin() {
		window.location.href = "/verification/";
	}

	return (
		<div className="w-screen h-screen flex items-center justify-center backdrop-blur-[3px]  bg-gradient-hero ">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Sign Up</CardTitle>
					<CardDescription>
						Enter your email and create a password or use Google to create an account.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					{GoogleSignInButton("signup")}
					<hr />
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" placeholder="m@example.com" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input id="password" type="password" />
					</div>
				</CardContent>
				<CardFooter className="flex flex-col">
					<Button className="w-full" onClick={handleLogin}>
						Sign Up
					</Button>
					<a
						className="text-sm text-muted-foreground hover:underline text-center mt-2"
						href="/log-in/">
						Log into an existing account
					</a>
				</CardFooter>
			</Card>
		</div>
	);
}

export default SignupCard;
