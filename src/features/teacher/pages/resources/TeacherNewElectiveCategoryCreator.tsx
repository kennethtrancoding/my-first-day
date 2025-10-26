import * as React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import TeacherDashboardLayout from "@/features/teacher/components/TeacherDashboardLayout";
import { useTeacherElectives } from "@/hooks/useTeacherCollections";
import type { ElectiveCategory, ElectiveCourse } from "@/data/electives";
import { useNavigate } from "react-router-dom";

// Keep the textarea styling consistent with the rest of the dashboard
export const textareaClassName =
	"flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px]";

// Local helper to mirror createId from your manager page
function createId(prefix: string) {
	if (typeof window !== "undefined" && (window as any).crypto?.randomUUID) {
		return (window as any).crypto.randomUUID();
	}
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Draft shape for the creator form
type ElectiveCategoryDraft = {
	title: string;
	tagline: string;
	includeCourse: boolean;
	courseName: string;
	courseGrades: string;
	courseDescription: string;
	courseFocusAreas: string; // comma separated
};

function createElectiveDraft(): ElectiveCategoryDraft {
	return {
		title: "",
		tagline: "",
		includeCourse: true,
		courseName: "",
		courseGrades: "Grades 6-8",
		courseDescription: "",
		courseFocusAreas: "",
	};
}

export default function TeacherNewElectiveCreator() {
	const [electives, setElectives] = useTeacherElectives();
	const navigate = useNavigate();

	const [draft, setDraft] = React.useState<ElectiveCategoryDraft>(() => createElectiveDraft());

	function handleCreateCategory() {
		// Build initial course if toggled on and a name is provided (otherwise skip)
		const maybeCourse: ElectiveCourse[] =
			draft.includeCourse && draft.courseName.trim()
				? [
						{
							name: draft.courseName.trim(),
							grades: draft.courseGrades.trim() || "Grades 6-8",
							description:
								draft.courseDescription.trim() ||
								"Add a short summary to help students choose.",
							focusAreas: draft.courseFocusAreas
								.split(",")
								.map((area) => area.trim())
								.filter(Boolean),
						},
				  ]
				: [];

		const newCategory: ElectiveCategory = {
			id: createId("elective-category"),
			title: draft.title.trim() || "New Category",
			tagline: draft.tagline.trim() || "Summarize what makes this pathway unique.",
			courses: maybeCourse,
		};

		setElectives((prev) => [...prev, newCategory]);
		navigate("/teacher/home/resources/electives/");
	}

	return (
		<TeacherDashboardLayout activePage="resources">
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="space-y-1">
								<CardTitle className="text-xl">
									{draft.title || "New Elective Category"}
								</CardTitle>
								<CardDescription>
									{draft.tagline ||
										"Create a pathway and (optionally) its first course."}
								</CardDescription>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Category basics */}
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Category title</Label>
								<Input
									value={draft.title}
									onChange={(e) =>
										setDraft((d) => ({ ...d, title: e.target.value }))
									}
									placeholder="Example: STEM & Innovation"
								/>
							</div>
							<div className="space-y-2">
								<Label>Tagline</Label>
								<Input
									value={draft.tagline}
									onChange={(e) =>
										setDraft((d) => ({ ...d, tagline: e.target.value }))
									}
									placeholder="Short description students see first"
								/>
							</div>
						</div>

						{/* First course toggle */}
						<div className="rounded-lg border p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium">Include a first course</p>
									<p className="text-xs text-muted-foreground">
										Add an initial course to this pathway now (you can edit
										later).
									</p>
								</div>
								<Switch
									checked={draft.includeCourse}
									onCheckedChange={(checked) =>
										setDraft((d) => ({ ...d, includeCourse: checked }))
									}
									id="include-course"
								/>
							</div>

							{draft.includeCourse && (
								<div className="space-y-4">
									<div className="grid gap-3 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="course-name">Course name</Label>
											<Input
												id="course-name"
												value={draft.courseName}
												onChange={(e) =>
													setDraft((d) => ({
														...d,
														courseName: e.target.value,
													}))
												}
												placeholder="Example: Intro to Robotics"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="course-grades">Grades</Label>
											<Input
												id="course-grades"
												value={draft.courseGrades}
												onChange={(e) =>
													setDraft((d) => ({
														...d,
														courseGrades: e.target.value,
													}))
												}
												placeholder="Example: Grades 7-8"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="course-description">Description</Label>
										<textarea
											id="course-description"
											className={textareaClassName}
											rows={4}
											value={draft.courseDescription}
											onChange={(e) =>
												setDraft((d) => ({
													...d,
													courseDescription: e.target.value,
												}))
											}
											placeholder="Give students a snapshot of what they'll build or learn."
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="course-focus">
											Focus areas (comma separated)
										</Label>
										<Input
											id="course-focus"
											value={draft.courseFocusAreas}
											onChange={(e) =>
												setDraft((d) => ({
													...d,
													courseFocusAreas: e.target.value,
												}))
											}
											placeholder="Coding, Design Thinking"
										/>
									</div>
								</div>
							)}
						</div>
					</CardContent>

					<CardFooter className="flex gap-2">
						<Button
							onClick={handleCreateCategory}
							disabled={!draft.title.trim() && !draft.includeCourse}>
							Create Category
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate("/teacher/home/resources/")}>
							Cancel
						</Button>
					</CardFooter>
				</Card>
			</div>
		</TeacherDashboardLayout>
	);
}
