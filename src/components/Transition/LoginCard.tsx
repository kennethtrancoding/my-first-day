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
import { Dot } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LoginCard() {
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
		window.location.href = "/home/";
	}

	return (
		<div className="w-screen h-screen flex items-center justify-center backdrop-blur-[3px]  bg-gradient-hero ">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Log In</CardTitle>
					<CardDescription>
						Enter your email and password or use Google to log into your account.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					{GoogleSignInButton("login")}
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
				<CardFooter className="flex flex-col justify-center">
					<Button className="w-full" onClick={handleLogin}>
						Log In
					</Button>
					<div className="flex items-center text-sm text-muted-foreground text-center mt-2">
						<a href="/sign-up/" className="hover:underline">
							Create account
						</a>
						<Dot size={16} />
						<a href="/" className="hover:underline">
							Reset password
						</a>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

export default LoginCard;
