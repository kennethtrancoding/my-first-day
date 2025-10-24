import { ArrowRight, FileText, Map, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import TeacherDashboardLayout from "@/features/teacher/components/TeacherDashboardLayout";
import { useNavigate } from "react-router-dom";

function TeacherDashboardPage() {
	const navigate = useNavigate();

	return (
		<TeacherDashboardLayout activePage="home">
			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Welcome back!</CardTitle>
						<CardDescription>
							Share helpful updates with students and keep campus information accurate.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col sm:flex-row gap-4">
						<Button
							size="lg"
							className="flex-1"
							onClick={() => navigate("/teacher/home/resources/")}>
							Manage Resources
							<ArrowRight size={16} className="ml-2" />
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="flex-1"
							onClick={() => navigate("/teacher/home/map/")}>
							Update Campus Map
							<ArrowRight size={16} className="ml-2" />
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Tips</CardTitle>
						<CardDescription>Keep new Huskies supported each week.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-muted-foreground">
						<p className="flex items-start gap-2">
							<Map className="w-4 h-4 mt-0.5 shrink-0" />
							Update locations for clubs and classrooms in the map editor.
						</p>
						<p className="flex items-start gap-2">
							<FileText className="w-4 h-4 mt-0.5 shrink-0" />
							Add new documents or resource links for students each grading period.
						</p>
						<p className="flex items-start gap-2">
							<Users className="w-4 h-4 mt-0.5 shrink-0" />
							Share onboarding checklists with fellow teachers for consistency.
						</p>
					</CardContent>
				</Card>
			</div>
		</TeacherDashboardLayout>
	);
}

export default TeacherDashboardPage;
