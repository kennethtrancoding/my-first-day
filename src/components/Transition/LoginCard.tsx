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
import { FormEvent, KeyboardEvent, useRef } from "react";
import { Dot } from "lucide-react";
import { Link } from "react-router-dom";
import GoogleSignInButton from "@/components/ui/googleSignIn";

function LoginCard() {
	const passwordRef = useRef<HTMLInputElement>(null);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		window.location.href = "/home/";
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
						<CardTitle>Log In</CardTitle>
						<CardDescription>
							Enter your email and password or use Google to log into your account.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<GoogleSignInButton type="login" />
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
					<CardFooter className="flex flex-col justify-center">
						<Button className="w-full" type="submit">
							Log In
						</Button>
						<div className="flex items-center text-sm text-muted-foreground text-center mt-2">
							<Link to="/sign-up/" className="hover:underline">
								Create account
							</Link>
							<Dot size={16} />
							<Link to="/" className="hover:underline">
								Reset password
							</Link>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}

export default LoginCard;
