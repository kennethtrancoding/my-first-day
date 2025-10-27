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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoredState } from "@/hooks/useStoredState";
import TeacherDashboardLayout from "@/features/teacher/components/TeacherDashboardLayout";
import {
	filterResourcesByAudience,
	type TeacherResource,
	type TeacherResourceAudience,
} from "@/utils/teacherData";
import { cn } from "@/lib/utils";
import { useTeacherElectives, useTeacherClubs } from "@/hooks/useTeacherCollections";
import type { ElectiveCategory, ElectiveCourse } from "@/data/electives";
import type { Club } from "@/utils/data";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

const audiences: { value: TeacherResourceAudience; label: string }[] = [
	{ value: "student", label: "Students" },
	{ value: "mentor", label: "Mentors" },
	{ value: "both", label: "Students & Mentors" },
];

export const textareaClassName =
	"flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px]";

const emptyDraft: Omit<TeacherResource, "id" | "updatedAt"> = {
	title: "",
	description: "",
	url: "",
	audience: "student",
};

export function slugifyLabel(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function generateSlug(desired: string, existing: Iterable<string>) {
	const slugSet = new Set(existing);
	const base = desired || `club-${Date.now()}`;
	if (!slugSet.has(base)) {
		return base;
	}

	let counter = 2;
	while (slugSet.has(`${base}-${counter}`)) {
		counter += 1;
	}
	return `${base}-${counter}`;
}

export const CLUB_PLACEHOLDER_IMAGE =
	"https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80";

type ElectiveCategoryDraft = {
	title: string;
	tagline: string;
	includeCourse: boolean;
	courseName: string;
	courseGrades: string;
	courseDescription: string;
	courseFocusAreas: string;
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

function ResourceSharingPanel() {
	const [resources, setResources, clearResources] = useStoredState<TeacherResource[]>(
		"teacher:resources",
		[]
	);
	const [draft, setDraft] = React.useState(emptyDraft);
	const [editingId, setEditingId] = React.useState<string | null>(null);

	const sortedResources = React.useMemo(() => {
		return [...resources].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
	}, [resources]);

	function resetForm() {
		setDraft(emptyDraft);
		setEditingId(null);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!draft.title.trim() || !draft.description.trim() || !draft.url.trim()) {
			return;
		}

		const normalizedUrl = draft.url.startsWith("http") ? draft.url : `https://${draft.url}`;

		setResources((prev) => {
			const next: TeacherResource[] = [...prev];
			const now = new Date().toISOString();

			if (editingId) {
				const idx = next.findIndex((item) => item.id === editingId);
				if (idx >= 0) {
					next[idx] = {
						...next[idx],
						...draft,
						url: normalizedUrl,
						updatedAt: now,
					};
				}
			} else {
				const id = window.crypto?.randomUUID?.() ?? `resource-${Date.now()}`;
				next.unshift({
					id,
					...draft,
					url: normalizedUrl,
					updatedAt: now,
				});
			}

			return next;
		});

		resetForm();
	}

	function handleEdit(resource: TeacherResource) {
		setDraft({
			title: resource.title,
			description: resource.description,
			url: resource.url,
			audience: resource.audience,
		});
		setEditingId(resource.id);
	}

	function handleDelete(id: string) {
		setResources((prev) => prev.filter((item) => item.id !== id));
		if (editingId === id) {
			resetForm();
		}
	}

	const hasStudentFacing = filterResourcesByAudience(resources, "student").length > 0;
	const hasMentorFacing = filterResourcesByAudience(resources, "mentor").length > 0;

	return (
		<div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
			<Card>
				<form onSubmit={handleSubmit} className="flex flex-col h-full">
					<CardHeader>
						<CardTitle>
							{editingId ? "Edit shared resource" : "Add a new resource"}
						</CardTitle>
						<CardDescription>
							Share helpful links or documents with students and mentors. Updates save
							automatically for everyone.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="resource-title">Title</Label>
							<Input
								id="resource-title"
								placeholder="Example: 6th Grade Orientation Slides"
								value={draft.title}
								onChange={(event) =>
									setDraft((prev) => ({ ...prev, title: event.target.value }))
								}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="resource-url">Link</Label>
							<Input
								id="resource-url"
								placeholder="https://"
								type="url"
								value={draft.url}
								onChange={(event) =>
									setDraft((prev) => ({ ...prev, url: event.target.value }))
								}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="resource-description">Description</Label>
							<textarea
								id="resource-description"
								placeholder="Who is this for and what will they learn?"
								value={draft.description}
								onChange={(event) =>
									setDraft((prev) => ({
										...prev,
										description: event.target.value,
									}))
								}
								rows={5}
								required
								className={textareaClassName}
							/>
						</div>

						<div className="space-y-2">
							<Label>Audience</Label>
							<div className="flex flex-wrap gap-2">
								{audiences.map((aud) => (
									<Button
										key={aud.value}
										type="button"
										variant={
											draft.audience === aud.value ? "default" : "outline"
										}
										onClick={() =>
											setDraft((prev) => ({ ...prev, audience: aud.value }))
										}>
										{aud.label}
									</Button>
								))}
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<div className="flex gap-2 w-full">
							<Button type="submit" className="flex-1">
								{editingId ? "Save changes" : "Publish resource"}
							</Button>
							<Button type="button" variant="ghost" onClick={resetForm}>
								{editingId ? "Cancel" : "Reset"}
							</Button>
						</div>
						<Button
							type="button"
							variant="ghost"
							className="text-destructive"
							onClick={() => {
								clearResources();
								resetForm();
							}}
							disabled={resources.length === 0}>
							Clear all shared resources
						</Button>
					</CardFooter>
				</form>
			</Card>

			<div className="space-y-4">
				<div className="grid gap-4">
					{sortedResources.length === 0 ? (
						<Card className="border-dashed">
							<CardContent className="p-6 text-center text-muted-foreground">
								No shared resources yet. Start by adding your first link.
							</CardContent>
						</Card>
					) : (
						sortedResources.map((resource) => (
							<Card key={resource.id}>
								<CardHeader className="flex flex-row items-start justify-between gap-2">
									<div>
										<CardTitle className="text-lg">{resource.title}</CardTitle>
										<CardDescription>
											Shared {new Date(resource.updatedAt).toLocaleString()}
										</CardDescription>
									</div>
									<Badge variant="secondary">{resource.audience}</Badge>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="text-sm text-muted-foreground">
										{resource.description}
									</p>
									<a
										href={resource.url}
										target="_blank"
										rel="noopener noreferrer"
										className={cn(
											"text-sm font-medium text-primary hover:underline break-all"
										)}>
										Link: {resource.url}
									</a>
								</CardContent>
								<CardFooter className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleEdit(resource)}>
										Edit
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive"
										onClick={() => handleDelete(resource.id)}>
										Remove
									</Button>
								</CardFooter>
							</Card>
						))
					)}
				</div>

				<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
					<span>
						{hasStudentFacing ? "Students" : "No students"} currently see shared
						resources.
					</span>
					<span>
						{hasMentorFacing ? "Mentors" : "No mentors"} currently see shared resources.
					</span>
				</div>
			</div>
		</div>
	);
}

function ElectiveManagerPanel() {
	const navigate = useNavigate();
	const [electives, setElectives] = useTeacherElectives();

	const [collapsedCategoryIds, setCollapsedCategoryIds] = React.useState<Set<string>>(
		() => new Set()
	);

	function removeCategory(categoryId: string) {
		setElectives((prev) => prev.filter((category) => category.id !== categoryId));
		setCollapsedCategoryIds((prev) => {
			if (!prev.has(categoryId)) return prev;
			const next = new Set(prev);
			next.delete(categoryId);
			return next;
		});
	}

	function toggleCategoryCollapse(categoryId: string) {
		setCollapsedCategoryIds((prev) => {
			const next = new Set(prev);
			if (next.has(categoryId)) {
				next.delete(categoryId);
			} else {
				next.add(categoryId);
			}
			return next;
		});
	}

	function updateCategory(categoryId: string, updates: Partial<ElectiveCategory>) {
		setElectives((prev) =>
			prev.map((category) =>
				category.id === categoryId ? { ...category, ...updates } : category
			)
		);
	}

	function addCourse(categoryId: string) {
		setElectives((prev) =>
			prev.map((category) => {
				if (category.id !== categoryId) return category;

				const newCourse: ElectiveCourse = {
					name: "New Course",
					grades: "Grades 6-8",
					description: "Give students a quick snapshot of what they will build or learn.",
					focusAreas: [],
				};

				return {
					...category,
					courses: [...category.courses, newCourse],
				};
			})
		);
	}

	function updateCourse(
		categoryId: string,
		courseIndex: number,
		updates: Partial<ElectiveCourse>
	) {
		setElectives((prev) =>
			prev.map((category) => {
				if (category.id !== categoryId) return category;

				const nextCourses = category.courses.map((course, idx) =>
					idx === courseIndex ? { ...course, ...updates } : course
				);

				return { ...category, courses: nextCourses };
			})
		);
	}

	function removeCourse(categoryId: string, courseIndex: number) {
		setElectives((prev) =>
			prev.map((category) => {
				if (category.id !== categoryId) return category;
				return {
					...category,
					courses: category.courses.filter((_, idx) => idx !== courseIndex),
				};
			})
		);
	}

	const hasElectives = electives.length > 0;

	function handleCreateCategory() {
		navigate(`/teacher/home/resources/new-elective-category/`);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold">Elective pathways</h2>
					<p className="text-muted-foreground">
						Update course descriptions so students always see current offerings.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" onClick={handleCreateCategory}>
						New category
					</Button>
				</div>
			</div>

			<div>
				<div className="space-y-6">
					{!hasElectives ? (
						<Card className="border-dashed">
							<CardContent className="p-6 text-center text-muted-foreground">
								No elective categories yet. Use “New category” to start organizing
								your courses.
							</CardContent>
						</Card>
					) : (
						<div className="space-y-6">
							{electives.map((category) => {
								const isCollapsed = collapsedCategoryIds.has(category.id);
								const contentId = `category-content-${category.id}`;

								return (
									<Card key={category.id}>
										<CardHeader>
											<div className="flex flex-wrap items-center justify-between gap-3">
												<div className="space-y-1">
													<CardTitle className="text-xl">
														{category.title}
													</CardTitle>
													<CardDescription>
														{category.tagline}
													</CardDescription>
												</div>

												<div className="flex flex-wrap items-center gap-2">
													<Badge variant="outline" className="text-xs">
														{category.courses.length}{" "}
														{category.courses.length === 1
															? "course"
															: "courses"}
													</Badge>

													<Button
														variant="ghost"
														size="sm"
														type="button"
														className="gap-1"
														onClick={() =>
															toggleCategoryCollapse(category.id)
														}
														aria-controls={contentId}
														aria-expanded={!isCollapsed}>
														{isCollapsed ? (
															<>
																<ChevronDown className="h-4 w-4" />
																Expand
															</>
														) : (
															<>
																<ChevronUp className="h-4 w-4" />
																Collapse
															</>
														)}
													</Button>

													<Button
														variant="ghost"
														className="text-destructive"
														onClick={() => removeCategory(category.id)}>
														Delete category
													</Button>
												</div>
											</div>
										</CardHeader>

										<CardContent
											id={contentId}
											aria-hidden={isCollapsed}
											className={cn("space-y-4", isCollapsed && "hidden")}>
											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>Category title</Label>
													<Input
														value={category.title}
														onChange={(event) =>
															updateCategory(category.id, {
																title: event.target.value,
															})
														}
														placeholder="Example: STEM & Innovation"
													/>
												</div>

												<div className="space-y-2">
													<Label>Tagline</Label>
													<Input
														value={category.tagline}
														onChange={(event) =>
															updateCategory(category.id, {
																tagline: event.target.value,
															})
														}
														placeholder="Short description students see first"
													/>
												</div>
											</div>

											<div className="space-y-3">
												<div className="flex items-center justify-between gap-2">
													<h4 className="text-lg font-medium">Courses</h4>
													<Button
														size="sm"
														variant="outline"
														onClick={() => addCourse(category.id)}>
														Add course
													</Button>
												</div>

												{category.courses.length === 0 ? (
													<p className="text-sm text-muted-foreground">
														No courses yet. Add your first course to
														describe this pathway.
													</p>
												) : (
													<div className="space-y-4">
														{category.courses.map((course, index) => (
															<div
																key={`${category.id}-${index}`}
																className="rounded-xl border p-4 space-y-3">
																<div className="flex items-start justify-between gap-3">
																	<div>
																		<p className="font-medium">
																			{course.name}
																		</p>
																		<p className="text-xs text-muted-foreground">
																			{course.grades}
																		</p>
																	</div>

																	<Button
																		size="sm"
																		variant="ghost"
																		className="text-destructive"
																		onClick={() =>
																			removeCourse(
																				category.id,
																				index
																			)
																		}>
																		Remove
																	</Button>
																</div>

																<div className="grid gap-3 lg:grid-cols-2">
																	<div className="space-y-2">
																		<Label>Course name</Label>
																		<Input
																			value={course.name}
																			onChange={(event) =>
																				updateCourse(
																					category.id,
																					index,
																					{
																						name: event
																							.target
																							.value,
																					}
																				)
																			}
																		/>
																	</div>

																	<div className="space-y-2">
																		<Label>Grades</Label>
																		<Input
																			value={course.grades}
																			onChange={(event) =>
																				updateCourse(
																					category.id,
																					index,
																					{
																						grades: event
																							.target
																							.value,
																					}
																				)
																			}
																			placeholder="Example: Grades 7-8"
																		/>
																	</div>
																</div>

																<div className="space-y-2">
																	<Label>Description</Label>
																	<textarea
																		className={
																			textareaClassName
																		}
																		rows={4}
																		value={course.description}
																		onChange={(event) =>
																			updateCourse(
																				category.id,
																				index,
																				{
																					description:
																						event.target
																							.value,
																				}
																			)
																		}
																	/>
																</div>

																<div className="space-y-2">
																	<Label>
																		Focus areas (comma
																		separated)
																	</Label>
																	<Input
																		value={(
																			course.focusAreas ?? []
																		).join(", ")}
																		onChange={(event) => {
																			const focusAreas =
																				event.target.value
																					.split(",")
																					.map((area) =>
																						area.trim()
																					)
																					.filter(
																						Boolean
																					);
																			updateCourse(
																				category.id,
																				index,
																				{ focusAreas }
																			);
																		}}
																		placeholder="Coding, Design Thinking"
																	/>
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function insertClub(newClub: Club, setClubs: React.Dispatch<React.SetStateAction<Club[]>>) {
	setClubs((prev) => [...prev, newClub]);
}

function ClubManagerPanel() {
	const [clubs, setClubs] = useTeacherClubs();
	const navigate = useNavigate();
	const [collapsedClubIds, setCollapsedClubIds] = React.useState<Set<number>>(() => new Set());

	const sortedClubs = React.useMemo(
		() => [...clubs].sort((a, b) => a.name.localeCompare(b.name)),
		[clubs]
	);

	function handleCreateClub() {
		navigate(`/teacher/home/resources/new-club/`);
	}

	function updateClub(clubId: number, updates: Partial<Club>) {
		setClubs((prev) =>
			prev.map((club) => (club.id === clubId ? { ...club, ...updates } : club))
		);
	}

	function removeClub(clubId: number) {
		setClubs((prev) => prev.filter((club) => club.id !== clubId));
		setCollapsedClubIds((prev) => {
			if (!prev.has(clubId)) {
				return prev;
			}
			const next = new Set(prev);
			next.delete(clubId);
			return next;
		});
	}

	function updateHighlightField(clubId: number, value: string) {
		const highlights = value
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		updateClub(clubId, { highlights });
	}

	function updateTagsField(clubId: number, value: string) {
		const tags = value
			.split(",")
			.map((tag) => tag.trim())
			.filter(Boolean);
		updateClub(clubId, { tags });
	}

	function addActivity(clubId: number) {
		setClubs((prev) =>
			prev.map((club) => {
				if (club.id !== clubId) {
					return club;
				}
				const activities = club.upcomingActivities ? [...club.upcomingActivities] : [];
				activities.push({
					title: "New Activity",
					date: "TBD",
					description: "Describe what students can expect.",
				});
				return {
					...club,
					upcomingActivities: activities,
				};
			})
		);
	}

	function updateActivity(
		clubId: number,
		index: number,
		updates: Partial<Club["upcomingActivities"][number]>
	) {
		setClubs((prev) =>
			prev.map((club) => {
				if (club.id !== clubId) {
					return club;
				}
				const activities = club.upcomingActivities ? [...club.upcomingActivities] : [];
				if (!activities[index]) {
					return club;
				}
				activities[index] = { ...activities[index], ...updates };
				return { ...club, upcomingActivities: activities };
			})
		);
	}

	function toggleClubCollapse(clubId: number) {
		setCollapsedClubIds((prev) => {
			const next = new Set(prev);
			if (next.has(clubId)) {
				next.delete(clubId);
			} else {
				next.add(clubId);
			}
			return next;
		});
	}

	function removeActivity(clubId: number, index: number) {
		setClubs((prev) =>
			prev.map((club) => {
				if (club.id !== clubId) {
					return club;
				}
				return {
					...club,
					upcomingActivities: (club.upcomingActivities ?? []).filter(
						(_, idx) => idx !== index
					),
				};
			})
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold">Club directory</h2>
					<p className="text-muted-foreground">
						Update club cards so students always see accurate meeting details.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" onClick={handleCreateClub}>
						New club
					</Button>
				</div>
			</div>

			<div>
				<div className="space-y-6">
					{sortedClubs.length === 0 ? (
						<Card className="border-dashed h-full">
							<CardContent className="p-6 text-center text-muted-foreground">
								No clubs yet. Add your first club to help students connect.
							</CardContent>
						</Card>
					) : (
						<div className="space-y-6">
							{sortedClubs.map((club) => {
								const isCollapsed = collapsedClubIds.has(club.id);
								const contentId = `club-content-${club.id}`;
								return (
									<Card key={club.id}>
										<CardHeader>
											<div className="flex flex-wrap items-center justify-between gap-3">
												<div className="space-y-1">
													<CardTitle className="text-xl">
														{club.name}
													</CardTitle>
													<CardDescription>
														{club.category}
													</CardDescription>
												</div>
												<div className="flex flex-wrap items-center gap-2">
													<Button
														variant="ghost"
														size="sm"
														type="button"
														className="gap-1"
														onClick={() => toggleClubCollapse(club.id)}
														aria-controls={contentId}
														aria-expanded={!isCollapsed}>
														{isCollapsed ? (
															<>
																<ChevronDown className="h-4 w-4" />
																Expand
															</>
														) : (
															<>
																<ChevronUp className="h-4 w-4" />
																Collapse
															</>
														)}
													</Button>
													<Button
														variant="ghost"
														className="text-destructive"
														onClick={() => removeClub(club.id)}>
														Delete club
													</Button>
												</div>
											</div>
										</CardHeader>
										<CardContent
											id={contentId}
											aria-hidden={isCollapsed}
											className={cn("space-y-4", isCollapsed && "hidden")}>
											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>Club name</Label>
													<Input
														value={club.name}
														onChange={(event) =>
															updateClub(club.id, {
																name: event.target.value,
																slug: generateSlug(
																	slugifyLabel(
																		event.target.value
																	),
																	clubs
																		.filter(
																			(c) => c.id !== club.id
																		)
																		.map((c) => c.slug)
																),
															})
														}
													/>
												</div>

												<div className="space-y-2">
													<Label>Category</Label>
													<Input
														value={club.category}
														onChange={(event) =>
															updateClub(club.id, {
																category: event.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Image URL</Label>
													<Input
														value={club.image}
														onChange={(event) =>
															updateClub(club.id, {
																image: event.target.value,
															})
														}
													/>
												</div>
											</div>

											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>Short description</Label>
													<textarea
														className={textareaClassName}
														rows={3}
														value={club.description}
														onChange={(event) =>
															updateClub(club.id, {
																description: event.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Long description</Label>
													<textarea
														className={textareaClassName}
														rows={3}
														value={club.longDescription}
														onChange={(event) =>
															updateClub(club.id, {
																longDescription: event.target.value,
															})
														}
													/>
												</div>
											</div>

											<div className="grid gap-4 md:grid-cols-3">
												<div className="space-y-2">
													<Label>Members</Label>
													<Input
														type="number"
														min={0}
														value={club.members}
														onChange={(event) => {
															const next = Number.parseInt(
																event.target.value,
																10
															);
															updateClub(club.id, {
																members: Number.isNaN(next)
																	? 0
																	: next,
															});
														}}
													/>
												</div>
												<div className="space-y-2">
													<Label>Next meeting</Label>
													<Input
														value={club.nextMeeting}
														onChange={(event) =>
															updateClub(club.id, {
																nextMeeting: event.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Location</Label>
													<Input
														value={club.location}
														onChange={(event) =>
															updateClub(club.id, {
																location: event.target.value,
															})
														}
													/>
												</div>
											</div>

											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>Advisor name</Label>
													<Input
														value={club.advisor}
														onChange={(event) =>
															updateClub(club.id, {
																advisor: event.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Advisor contact email</Label>
													<Input
														type="email"
														value={club.contactEmail}
														onChange={(event) =>
															updateClub(club.id, {
																contactEmail: event.target.value,
															})
														}
													/>
												</div>
											</div>

											<div className="space-y-2">
												<Label>Requirements</Label>
												<textarea
													className={textareaClassName}
													rows={2}
													value={club.requirements ?? ""}
													onChange={(event) =>
														updateClub(club.id, {
															requirements: event.target.value,
														})
													}
													placeholder="Auditions, grade restrictions, or other notes"
												/>
											</div>

											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>Highlights (one per line)</Label>
													<textarea
														className={textareaClassName}
														rows={4}
														value={(club.highlights ?? []).join("\n")}
														onChange={(event) =>
															updateHighlightField(
																club.id,
																event.target.value
															)
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Tags (comma separated)</Label>
													<Input
														value={(club.tags ?? []).join(", ")}
														onChange={(event) =>
															updateTagsField(
																club.id,
																event.target.value
															)
														}
														placeholder="Leadership, Service, STEM"
													/>
												</div>
											</div>

											<div className="space-y-3">
												<div className="flex items-center gap-3">
													<Switch
														checked={club.featured ?? false}
														onCheckedChange={(checked) =>
															updateClub(club.id, {
																featured: checked,
															})
														}
														id={`featured-${club.id}`}
													/>
													<Label
														htmlFor={`featured-${club.id}`}
														className="text-sm">
														Show on student dashboard hero cards
													</Label>
												</div>

												<div className="space-y-2">
													<div className="flex items-center justify-between gap-2">
														<h4 className="font-medium">
															Upcoming activities
														</h4>
														<Button
															size="sm"
															variant="outline"
															onClick={() => addActivity(club.id)}>
															Add activity
														</Button>
													</div>
													{(club.upcomingActivities ?? []).length ===
													0 ? (
														<p className="text-sm text-muted-foreground">
															No upcoming events yet. Add your first
															meeting or activity.
														</p>
													) : (
														<div className="space-y-3">
															{(club.upcomingActivities ?? []).map(
																(activity, index) => (
																	<div
																		key={`${club.id}-activity-${index}`}
																		className="rounded-lg border p-3 space-y-2">
																		<div className="grid gap-2 md:grid-cols-2">
																			<div className="space-y-1">
																				<Label>Title</Label>
																				<Input
																					value={
																						activity.title
																					}
																					onChange={(
																						event
																					) =>
																						updateActivity(
																							club.id,
																							index,
																							{
																								title: event
																									.target
																									.value,
																							}
																						)
																					}
																				/>
																			</div>
																			<div className="space-y-1">
																				<Label>Date</Label>
																				<Input
																					value={
																						activity.date
																					}
																					onChange={(
																						event
																					) =>
																						updateActivity(
																							club.id,
																							index,
																							{
																								date: event
																									.target
																									.value,
																							}
																						)
																					}
																					placeholder="Nov 14"
																				/>
																			</div>
																		</div>
																		<div className="space-y-1">
																			<Label>
																				Description
																			</Label>
																			<textarea
																				className={
																					textareaClassName
																				}
																				rows={2}
																				value={
																					activity.description
																				}
																				onChange={(event) =>
																					updateActivity(
																						club.id,
																						index,
																						{
																							description:
																								event
																									.target
																									.value,
																						}
																					)
																				}
																			/>
																		</div>
																		<div className="flex justify-end">
																			<Button
																				variant="ghost"
																				size="sm"
																				className="text-destructive"
																				onClick={() =>
																					removeActivity(
																						club.id,
																						index
																					)
																				}>
																				Remove
																			</Button>
																		</div>
																	</div>
																)
															)}
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function TeacherResourceManagerPage() {
	return (
		<TeacherDashboardLayout activePage="resources">
			<Tabs defaultValue="resources" className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold">Teacher Resource Center</h1>
						<p className="text-muted-foreground">
							Manage shared links, electives, and clubs.
						</p>
					</div>
					<TabsList>
						<TabsTrigger value="resources">Resources</TabsTrigger>
						<TabsTrigger value="electives">Electives</TabsTrigger>
						<TabsTrigger value="clubs">Clubs</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="resources">
					<ResourceSharingPanel />
				</TabsContent>

				<TabsContent value="electives">
					<ElectiveManagerPanel />
				</TabsContent>

				<TabsContent value="clubs">
					<ClubManagerPanel />
				</TabsContent>
			</Tabs>
		</TeacherDashboardLayout>
	);
}

export default TeacherResourceManagerPage;
