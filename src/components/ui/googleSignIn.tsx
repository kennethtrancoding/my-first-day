import { useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";

declare global {
	interface Window {
		google?: any;
	}
}

type GoogleSignInType = "login" | "signup";

type GoogleSignInProps = {
	type: GoogleSignInType;
};

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export default function GoogleSignIn({ type }: GoogleSignInProps) {
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
					console.log("Google response:", response);

					if (type === "login") {
						navigate("/home/");
					} else if (type === "signup") {
						navigate("/verification/");
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
	}, [buttonContainerId, navigate, type]);

	return <div id={buttonContainerId}></div>;
}
