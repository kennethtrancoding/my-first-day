import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Landing/Landing";
import LogIn from "./pages/Landing/LogIn";
import SignUp from "./pages/Landing/SignUp";
import Home from "./pages/Dashboard/Dashboard";
import ClubList from "./pages/Dashboard/Clubs/Clubs";
import ClubDetail from "./pages/Dashboard/Clubs/ClubDetail";
import ClubDirectory from "./pages/Dashboard/Clubs/ClubDirectory";
import ResourcesPage from "./pages/Dashboard/Resources";
import SettingsPage from "./pages/Dashboard/Settings";
import MentorDirectory from "@/pages/Dashboard/Messaging/MentorDirectory";
import Map from "./pages/Map/Map";
import MessagingLayout from "./pages/Dashboard/Messaging/Messages";
import Onboarding from "./components/Transition/Onboarding";
import SignupVerificationCode from "./components/Transition/SignupVerificationCode";

const queryClient = new QueryClient();
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Sonner />
			<div className="bg-gray-200 text-center text-sm">
				Demo version. No data is saved. Verification code is <strong>218058</strong>.
			</div>
			<BrowserRouter basename={basename}>
				<Routes>
					<Route path="/" element={<Index />} />
					<Route path="/verification/" element={<SignupVerificationCode />} />
					<Route path="/onboarding/" element={<Onboarding />} />
					<Route path="/log-in/" element={<LogIn />} />
					<Route path="/sign-up/" element={<SignUp />} />
					<Route path="/home/" element={<Home />} />
					<Route path="/home/messages/:id?/" element={<MessagingLayout />} />
					<Route path="/home/clubs/" element={<ClubList />} />
					<Route path="/home/clubs/directory/" element={<ClubDirectory />} />
					<Route path="/home/resources/" element={<ResourcesPage />} />
					<Route path="/home/clubs/:clubSlug/" element={<ClubDetail />} />
					<Route path="/home/settings/" element={<SettingsPage />} />
					<Route path="/home/resources/map/" element={<Map />} />
					<Route
						path="/home/messages/mentors-directory/:mentorSlug?/"
						element={<MentorDirectory />}
					/>
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
