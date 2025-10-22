import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const redirectPrefix = "#redirect";
const basePath = import.meta.env.PROD ? "" : "";

if (window.location.hash.startsWith(redirectPrefix)) {
	const rawTarget = decodeURIComponent(window.location.hash.slice(redirectPrefix.length));
	const sanitizedTarget = rawTarget.startsWith("/") ? rawTarget : `/${rawTarget}`;
	const updatedUrl = `${basePath}${sanitizedTarget}`;
	window.history.replaceState(null, "", updatedUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
