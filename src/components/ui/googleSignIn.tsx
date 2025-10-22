import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

declare global {
	interface Window {
		google?: any;
	}
}

export default function GoogleSignIn(type: string) {
	const navigate = useNavigate();

	useEffect(() => {
		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		document.body.appendChild(script);

		script.onload = () => {
			const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

			window.google?.accounts.id.renderButton(document.getElementById("googleSignInDiv"), {
				theme: "outline",
				size: "large",
			});
		};
	}, []);

	return <div id="googleSignInDiv"></div>;
}
