import { useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { findAccount, registerAccount, setCurrentEmail, type StoredAccount } from "@/utils/auth";

declare global {
	interface Window {
		google?: any;
	}
}

type GoogleSignInType = "login" | "signup";

type GoogleSignInProps = {
	type: GoogleSignInType;
	onSuccess?: (account: StoredAccount) => void;
	onError?: (message: string) => void;
};

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function decodeCredentialEmail(credential?: string) {
	if (!credential) {
		return "";
	}

	try {
		const [, payload = ""] = credential.split(".");
		const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
		const json = atob(padded);
		const parsed = JSON.parse(json) as { email?: string };
		return parsed.email ?? "";
	} catch (error) {
		console.warn("[GoogleSignIn] Failed to decode credential:", error);
		return "";
	}
}

export default function GoogleSignIn({ type, onSuccess, onError }: GoogleSignInProps) {
	const navigate = useNavigate();
	const buttonContainerId = useId();

	useEffect(() => {
		const clientId = "412451533645-tgmjdta1gpbmrgppo7bkogon9uslfm2j.apps.googleusercontent.com";

		if (!clientId) {
			console.warn("[GoogleSignIn] Missing VITE_GOOGLE_CLIENT_ID env value.");
			return;
		}

		const ensureScript = () => {
			const existingScript = document.querySelector<HTMLScriptElement>(
				`script[src="${GOOGLE_SCRIPT_SRC}"]`
			);

			if (existingScript) {
				return existingScript;
			}

			const script = document.createElement("script");
			script.src = GOOGLE_SCRIPT_SRC;
			script.async = true;
			script.defer = true;
			document.body.appendChild(script);
			return script;
		};

		const script = ensureScript();

		const initialize = () => {
			window.google?.accounts.id.initialize({
				client_id: clientId,
				callback: (response: any) => {
					const email = decodeCredentialEmail(response?.credential);
					if (!email) {
						onError?.("We could not read your Google account. Try again.");
						return;
					}

					if (type === "login") {
						const account = findAccount(email);
						if (!account) {
							onError?.(
								"No account found for your Google email. Create an account to continue."
							);
							return;
						}

						setCurrentEmail(account.email);
						onSuccess?.(account);
						if (!onSuccess) {
							const destination =
								account.role === "mentor" ? "/mentor/home/" : "/student/home/";
							navigate(destination, { replace: true });
						}
					}

					if (type === "signup") {
						const existing = findAccount(email);
						if (existing) {
							onError?.("An account with this email already exists. Log in instead.");
							return;
						}

						const account = registerAccount({
							email,
							password: "__google_oauth__",
						});

						if (!account) {
							onError?.("We could not create your account. Try again.");
							return;
						}

						onSuccess?.(account);
						if (!onSuccess) {
							navigate("/verification/", { replace: true });
						}
					}
				},
			});

			const targetElement = document.getElementById(buttonContainerId);

			if (!targetElement) {
				console.warn("[GoogleSignIn] Button container not found.");
				return;
			}

			window.google?.accounts.id.renderButton(targetElement, {
				theme: "outline",
				size: "large",
			});
		};

		if (window.google?.accounts?.id) {
			initialize();
		} else {
			script.addEventListener("load", initialize, { once: true });
		}

		return () => {
			script.removeEventListener("load", initialize);
		};
	}, [buttonContainerId, navigate, onError, onSuccess, type]);

	return <div id={buttonContainerId}></div>;
}
