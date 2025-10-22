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
import { Dot } from "lucide-react";
import { Link } from "react-router-dom";
import GoogleSignInButton from "@/components/ui/googleSignIn";

function LoginCard() {
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
					<GoogleSignInButton type="login" />
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
						<Link to="/sign-up/" className="hover:underline">
							Create account
						</Link>
						<Dot size={16} />
						<Link to="/" className="hover:underline">
							Reset password
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

export default LoginCard;
