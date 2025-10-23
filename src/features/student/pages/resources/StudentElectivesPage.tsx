import { Button } from "@/components/ui/button";
import StudentDashboardLayout from "@/features/student/components/StudentDashboardLayout";
import { ElectiveList } from "@/features/shared/components/ElectiveList";
import { ArrowRight } from "lucide-react";

const CALENDAR_PDF_URL = "/calendar-bell-schedule.pdf";

const StudentElectivesPage = () => {
	return (
		<StudentDashboardLayout activePage="resources">
			<div className="container mx-auto px-4 py-10 space-y-10">
				<ElectiveList heading="Elective Course List" />

				<div className="rounded-xl border border-dashed bg-muted/40 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
					<div className="space-y-1">
						<p className="text-lg font-semibold tracking-wide">
							Bell Schedule & Calendar
						</p>
						<p className="text-sm text-muted-foreground">
							Need to cross-check elective times? Download the current bell schedule
							and district calendar.
						</p>
					</div>

					<Button asChild className="mt-4 sm:mt-0" variant="secondary">
						<a href={CALENDAR_PDF_URL} target="_blank" rel="noopener noreferrer">
							View Bell Schedule & Calendar
							<ArrowRight size={16} className="ml-2" />
						</a>
					</Button>
				</div>
			</div>
		</StudentDashboardLayout>
	);
};

export default StudentElectivesPage;
