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
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { Dot, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "@/components/ui/googleSignIn";
import { authenticate, type StoredAccount } from "@/utils/auth";
import { cn } from "@/lib/utils";

function LoginCard() {
	const passwordRef = useRef<HTMLInputElement>(null);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const navigate = useNavigate();

	function handleSuccessfulLogin(account: StoredAccount) {
		setFeedback(null);

		const hasCompletedOnboarding = account.wentThroughOnboarding === true;
		let destination = "/onboarding/";

		if (hasCompletedOnboarding) {
			setEmail("");
			setPassword("");

			if (account.role === "mentor") {
				const mentorType = account.profile?.mentorType ?? "student";
				destination = mentorType === "teacher" ? "/teacher/home/" : "/mentor/home/";
			} else {
				destination = "/student/home/";
			}
		}

		setIsSubmitting(true);
		setTimeout(() => {
			setIsSubmitting(false);
			navigate(destination, { replace: true });
		}, 900);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmedEmail = email.trim();

		if (!trimmedEmail || !password) {
			setFeedback({
				type: "error",
				text: "Enter both your email and password to continue.",
			});
			return;
		}

		const account = authenticate(trimmedEmail, password);
		if (!account) {
			setFeedback({
				type: "error",
				text: "Invalid email or password. Try again or create an account.",
			});
			return;
		}

		handleSuccessfulLogin(account);
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

	function handleForgotPassword() {
		const trimmedEmail = email.trim();

		setFeedback(null);
		navigate("/reset-password/", {
			state: { email: trimmedEmail },
		});
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
						<GoogleSignInButton
							type="login"
							onSuccess={handleSuccessfulLogin}
							onError={(message) =>
								setFeedback({
									type: "error",
									text: message,
								})
							}
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
							{feedback && (
								<p
									className={cn(
										"text-sm",
										feedback.type === "error"
											? "text-destructive"
											: "text-green-600"
									)}>
									{feedback.text}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter className="flex flex-col justify-center">
						<Button className="w-full" type="submit">
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Submitting
								</>
							) : (
								"Log In"
							)}
						</Button>
						<div className="flex items-center text-sm text-muted-foreground text-center mt-2">
							<Link to="/sign-up/" className="hover:underline">
								Create an account
							</Link>
							<Dot size={16} />
							<button
								type="button"
								className="hover:underline text-muted-foreground"
								onClick={handleForgotPassword}>
								Forgot password?
							</button>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}

export default LoginCard;
