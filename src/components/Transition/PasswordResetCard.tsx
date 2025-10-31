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
import { cn } from "@/lib/utils";
import { readFromStorage, writeToStorage } from "@/utils/storage";

const ACCOUNTS_KEY = "auth:accounts";

type Account = {
	id: number;
	email: string;
	password: string;
	[key: string]: any;
};

function findAccountByEmail(email: string): Account | null {
	const accounts = readFromStorage<Account[]>(ACCOUNTS_KEY, [] as Account[]);
	const normalized = email.trim().toLowerCase();
	return accounts.find((a) => a.email.toLowerCase() === normalized) ?? null;
}

function resetPasswordByEmail(email: string, newPassword: string): boolean {
	const accounts = readFromStorage<Account[]>(ACCOUNTS_KEY, [] as Account[]);
	const normalized = email.trim().toLowerCase();
	const idx = accounts.findIndex((a) => a.email.toLowerCase() === normalized);
	if (idx === -1) return false;
	accounts[idx] = { ...accounts[idx], password: newPassword };
	writeToStorage(ACCOUNTS_KEY, accounts);
	return true;
}

type Feedback = { type: "error" | "success"; text: string } | null;

function PasswordResetCard() {
	const navigate = useNavigate();
	const location = useLocation();

	// Prefill from router state if available
	const initialEmail = React.useMemo(() => {
		const state = location.state as { email?: string } | undefined;
		return state?.email ?? "";
	}, [location.state]);

	const [email, setEmail] = React.useState<string>(initialEmail);
	const [password, setPassword] = React.useState("");
	const [confirmPassword, setConfirmPassword] = React.useState("");
	const [feedback, setFeedback] = React.useState<Feedback>(null);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setEmail(initialEmail);
	}, [initialEmail]);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const emailTrimmed = email.trim().toLowerCase();

		if (!emailTrimmed) {
			setFeedback({ type: "error", text: "Enter the email tied to your account." });
			return;
		}

		// simple email format check
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailPattern.test(emailTrimmed)) {
			setFeedback({ type: "error", text: "Enter a valid email address." });
			return;
		}

		if (!password) {
			setFeedback({ type: "error", text: "Enter a new password." });
			return;
		}

		if (password !== confirmPassword) {
			setFeedback({ type: "error", text: "Passwords do not match." });
			return;
		}

		const account = findAccountByEmail(emailTrimmed);
		if (!account) {
			setFeedback({ type: "error", text: "We couldn't find an account with that email." });
			return;
		}

		setIsSubmitting(true);
		const updated = resetPasswordByEmail(emailTrimmed, password);
		setIsSubmitting(false);

		if (!updated) {
			setFeedback({ type: "error", text: "We couldn't update your password. Try again." });
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
								onChange={(e) => setEmail(e.target.value)}
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
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="new-password"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="confirm-password">Confirm new password</Label>
							<Input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								autoComplete="new-password"
							/>
						</div>

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
