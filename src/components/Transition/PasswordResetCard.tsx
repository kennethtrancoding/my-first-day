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
import { useLocation, useNavigate } from "react-router-dom";
import { findAccount, resetPassword } from "@/utils/auth";
import { cn } from "@/lib/utils";

type Feedback = { type: "error" | "success"; text: string } | null;

function PasswordResetCard() {
	const navigate = useNavigate();
	const location = useLocation();
	const initialEmail = React.useMemo(() => {
		const state = location.state as { email?: string } | undefined;
		return state?.email ?? "";
	}, [location.state]);

	const [email, setEmail] = React.useState(initialEmail);
	const [password, setPassword] = React.useState("");
	const [confirmPassword, setConfirmPassword] = React.useState("");
	const [feedback, setFeedback] = React.useState<Feedback>(null);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setEmail(initialEmail);
	}, [initialEmail]);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmedEmail = email.trim();
		if (!trimmedEmail) {
			setFeedback({
				type: "error",
				text: "Enter the email tied to your account.",
			});
			return;
		}
		if (!password) {
			setFeedback({
				type: "error",
				text: "Enter a new password.",
			});
			return;
		}
		if (password !== confirmPassword) {
			setFeedback({
				type: "error",
				text: "Passwords do not match.",
			});
			return;
		}

		const account = findAccount(trimmedEmail);
		if (!account) {
			setFeedback({
				type: "error",
				text: "We couldn't find an account with that email.",
			});
			return;
		}

		setIsSubmitting(true);
		const updated = resetPassword(trimmedEmail, password);
		setIsSubmitting(false);

		if (!updated) {
			setFeedback({
				type: "error",
				text: "We couldn't update your password. Try again.",
			});
			return;
		}

		setFeedback({
			type: "success",
			text: "Your password has been updated. You can return to log in.",
		});
		setPassword("");
		setConfirmPassword("");
	}

	return (
		<div className="w-screen h-screen flex items-center justify-center backdrop-blur-[3px] bg-gradient-hero">
			<Card className="w-full max-w-sm">
				<form onSubmit={handleSubmit} className="flex h-full flex-col">
					<CardHeader>
						<CardTitle>Reset Password</CardTitle>
						<CardDescription>
							Enter your account email and set a new password to regain access.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="reset-email">Email</Label>
							<Input
								id="reset-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="m@example.com"
								autoComplete="email"
								spellCheck={false}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="new-password">New password</Label>
							<Input
								id="new-password"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								autoComplete="new-password"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="confirm-password">Confirm new password</Label>
							<Input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								autoComplete="new-password"
							/>
						</div>
						{feedback && (
							<p
								className={cn(
									"text-sm",
									feedback.type === "error" ? "text-destructive" : "text-green-600"
								)}>
								{feedback.text}
							</p>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-2">
						<Button className="w-full" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Updating..." : "Reset Password"}
						</Button>
						<button
							type="button"
							className="text-sm text-muted-foreground hover:underline"
							onClick={() => navigate("/log-in/")}>
							Return to log in
						</button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}

export default PasswordResetCard;
