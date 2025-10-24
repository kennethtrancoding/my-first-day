import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./features/shared/pages/Landing/Landing";
import LogIn from "./features/shared/pages/Landing/LogIn";
import SignUp from "./features/shared/pages/Landing/SignUp";
import StudentDashboardPage from "@/features/student/pages/dashboard/StudentDashboardPage";
import StudentClubListPage from "@/features/student/pages/clubs/StudentClubListPage";
import StudentClubDetailPage from "@/features/student/pages/clubs/StudentClubDetailPage";
import StudentClubDirectoryPage from "@/features/student/pages/clubs/StudentClubDirectoryPage";
import StudentResourcesPage from "@/features/student/pages/resources/StudentResourcesPage";
import StudentElectivesPage from "@/features/student/pages/resources/StudentElectivesPage";
import StudentSettingsPage from "@/features/student/pages/settings/StudentSettingsPage";
import StudentMentorDirectoryPage from "@/features/student/pages/messaging/StudentMentorDirectoryPage";
import CampusMapPage from "@/features/shared/pages/map/CampusMapPage";
import StudentMessagingLayout from "@/features/student/pages/messaging/StudentMessagingLayout";
import Onboarding from "./components/Transition/Onboarding";
import SignupVerificationCode from "./components/Transition/SignupVerificationCode";

import MentorRegistrationPage from "@/features/mentor/pages/registration/MentorRegistrationPage";
import MentorDashboardPage from "@/features/mentor/pages/dashboard/MentorDashboardPage";
import MentorRequestManagementPage from "@/features/mentor/pages/requests/MentorRequestManagementPage";
import MentorMessagingLayout from "@/features/mentor/pages/messaging/MentorMessagingLayout";
import MentorClubListPage from "@/features/mentor/pages/clubs/MentorClubListPage";
import MentorClubDirectoryPage from "@/features/mentor/pages/clubs/MentorClubDirectoryPage";
import MentorClubDetailPage from "@/features/mentor/pages/clubs/MentorClubDetailPage";
import MentorResourcesPage from "@/features/mentor/pages/resources/MentorResourcesPage";
import MentorElectivesPage from "@/features/mentor/pages/resources/MentorElectivesPage";
import MentorSettingsPage from "@/features/mentor/pages/settings/MentorSettingsPage";
import ResetPassword from "./features/shared/pages/Landing/ResetPassword";
import NotFoundPage from "@/features/shared/pages/errors/NotFoundPage";
import TeacherDashboardPage from "@/features/teacher/pages/dashboard/TeacherDashboardPage";
import TeacherResourceManagerPage from "@/features/teacher/pages/resources/TeacherResourceManagerPage";
import TeacherMapEditorPage from "@/features/teacher/pages/map/TeacherMapEditorPage";
import TeacherMapCoordinatesEditor from "./features/teacher/pages/map/TeacherMapCoordinatesEditor";

const queryClient = new QueryClient();

function App() {
	return (
		<>
			<div className="bg-gray-200 text-center text-sm">
				Demo version. Mock students are used; data is saved locally. Verification code is{" "}
				<strong>218058</strong>.
			</div>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<Sonner />

					<BrowserRouter>
						<Routes>
							<Route path="/" element={<Index />} />
							<Route path="/verification/" element={<SignupVerificationCode />} />
							<Route path="/onboarding/" element={<Onboarding />} />
							<Route path="/log-in/" element={<LogIn />} />
							<Route path="/sign-up/" element={<SignUp />} />
							<Route path="/reset-password/" element={<ResetPassword />} />
							<Route path="/student/home/" element={<StudentDashboardPage />} />
							<Route
								path="/student/home/messages/:id?/"
								element={<StudentMessagingLayout />}
							/>
							<Route path="/student/home/clubs/" element={<StudentClubListPage />} />
							<Route
								path="/student/home/clubs/directory/"
								element={<StudentClubDirectoryPage />}
							/>
							<Route
								path="/student/home/resources/"
								element={<StudentResourcesPage />}
							/>
							<Route
								path="/student/home/resources/electives/"
								element={<StudentElectivesPage />}
							/>
							<Route
								path="/student/home/clubs/:clubSlug/"
								element={<StudentClubDetailPage />}
							/>
							<Route
								path="/student/home/settings/"
								element={<StudentSettingsPage />}
							/>
							<Route
								path="/student/home/resources/map/"
								element={<CampusMapPage />}
							/>
							<Route
								path="/student/home/messages/mentors-directory/:mentorSlug?/"
								element={<StudentMentorDirectoryPage />}
							/>
							<Route
								path="/mentor/registration/"
								element={<MentorRegistrationPage />}
							/>
							<Route path="/mentor/home/" element={<MentorDashboardPage />} />
							<Route
								path="/mentor/home/requests/"
								element={<MentorRequestManagementPage />}
							/>
							<Route
								path="/mentor/home/messages/:id?/"
								element={<MentorMessagingLayout />}
							/>
							<Route path="/mentor/home/clubs/" element={<MentorClubListPage />} />
							<Route
								path="/mentor/home/clubs/directory/"
								element={<MentorClubDirectoryPage />}
							/>
							<Route
								path="/mentor/home/clubs/:clubSlug/"
								element={<MentorClubDetailPage />}
							/>
							<Route
								path="/mentor/home/resources/"
								element={<MentorResourcesPage />}
							/>
							<Route
								path="/mentor/home/resources/electives/"
								element={<MentorElectivesPage />}
							/>
							<Route path="/mentor/home/resources/map/" element={<CampusMapPage />} />
							<Route path="/mentor/home/settings/" element={<MentorSettingsPage />} />
							<Route path="/teacher/home/" element={<TeacherDashboardPage />} />
							<Route
								path="/teacher/home/resources/"
								element={<TeacherResourceManagerPage />}
							/>
							<Route path="/teacher/home/map/" element={<TeacherMapEditorPage />} />
							<Route
								path="/teacher/home/mapCoordinates/"
								element={<TeacherMapCoordinatesEditor />}
							/>

							<Route path="*" element={<NotFoundPage />} />
						</Routes>
					</BrowserRouter>
				</TooltipProvider>
			</QueryClientProvider>
		</>
	);
}

export default App;
