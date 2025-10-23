import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { ElectiveList } from "@/features/shared/components/ElectiveList";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CALENDAR_PDF_URL = "/calendar-bell-schedule.pdf";

const MentorElectivesPage = () => {
	return (
		<MentorDashboardLayout activePage="resources">
			<div className="container mx-auto px-4 py-10 space-y-10">
				<ElectiveList heading="Elective Offerings Overview" />

				<div className="rounded-xl border border-dashed bg-muted/40 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
					<div className="space-y-1">
						<p className="text-sm font-semibold uppercase tracking-wide text-secondary">
							Calendar Reference
						</p>
						<p className="text-sm text-muted-foreground">
							Review bell times and important dates when advising students on course selections.
						</p>
					</div>

					<Button
						asChild
						className="mt-4 sm:mt-0"
						variant="secondary">
						<a href={CALENDAR_PDF_URL} target="_blank" rel="noopener noreferrer">
							Open Calendar PDF <ArrowRight size={16} className="ml-2" />
						</a>
					</Button>
				</div>
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorElectivesPage;
