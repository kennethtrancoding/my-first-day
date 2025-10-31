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
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { registerAccount, findAccountUsingEmail } from "@/utils/auth";
import { Loader2 } from "lucide-react";

function SignupCard() {
	const navigate = useNavigate();
	const passwordRef = useRef<HTMLInputElement>(null);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmedEmail = email.trim();

		if (!trimmedEmail || !password) {
			setError("Enter both your email and password to continue.");
			return;
		}

		const existing = findAccountUsingEmail(trimmedEmail);
		if (existing) {
			setError("An account with this email already exists. Log in instead.");
			return;
		}

		const registered = registerAccount({ email: trimmedEmail, password });
		if (!registered) {
			setError("We couldn't create your account. Try again.");
			return;
		}

		setError(null);
		setIsSubmitting(true);

		setTimeout(() => {
			setIsSubmitting(false);
			setEmail("");
			setPassword("");
			navigate("/verification/");
		}, 900);
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
							Enter your email and create a password or use Google to create an
							account.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<GoogleSignInButton
							type="signup"
							onSuccess={() => {
								setError(null);
								setEmail("");
								setPassword("");
								navigate("/verification/");
							}}
							onError={(message) => setError(message)}
						/>
						<hr />
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="m@example.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								onKeyDown={handleEmailKeyDown}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								ref={passwordRef}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								onKeyDown={handlePasswordKeyDown}
							/>
							{error && <p className="text-sm text-destructive">{error}</p>}
						</div>
					</CardContent>
					<CardFooter className="flex flex-col">
						<Button className="w-full" type="submit">
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Submitting
								</>
							) : (
								"Sign Up"
							)}
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
