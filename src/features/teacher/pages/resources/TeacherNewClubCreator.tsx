import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Switch } from "@radix-ui/react-switch";
import TeacherDashboardLayout from "../../components/TeacherDashboardLayout";
import { type Club } from "@/utils/constants";
import {
	CLUB_PLACEHOLDER_IMAGE,
	generateSlug,
	slugifyLabel,
	textareaClassName,
	insertClub,
} from "./TeacherResourceManagerPage";
import { useTeacherClubs } from "@/hooks/useTeacherCollections";
import { useNavigate } from "react-router-dom";

export default function TeacherNewClubCreator() {
	const [clubs, setClubs] = useTeacherClubs();
	const navigate = useNavigate();

	const initialId = useMemo(() => Date.now(), []);
	const [draft, setDraft] = useState<Club>(() => {
		const baseName = "New Club";
		const baseSlug = slugifyLabel(baseName) || `club-${initialId}`;
		return {
			id: initialId,
			name: baseName,
			slug: baseSlug,
			category: "General",
			description: "Enter a description for your club.",
			longDescription: "Use the editor to add the club story, traditions, and highlights.",
			members: 0,
			nextMeeting: "TBD",
			location: "TBD",
			advisor: "Staff Advisor",
			contactEmail: "info@wcusd.org",
			image: CLUB_PLACEHOLDER_IMAGE,
			color: "bg-gradient-primary",
			highlights: [],
			upcomingActivities: [],
			requirements: "",
			tags: [],
			featured: false,
		};
	});

	function handleCreateClub() {
		insertClub(draft, setClubs);
		navigate(`/teacher/home/resources/`);
	}

	const updateSlugForName = (name: string) => {
		const taken = clubs.filter((c) => c.id !== draft.id).map((c) => c.slug);
		return generateSlug(slugifyLabel(name), taken);
	};

	const updateActivity = (
		index: number,
		updates: Partial<Club["upcomingActivities"][number]>
	) => {
		setDraft((d) => {
			const next = d.upcomingActivities ? [...d.upcomingActivities] : [];
			if (!next[index]) return d;
			next[index] = { ...next[index], ...updates };
			return { ...d, upcomingActivities: next };
		});
	};

	const removeActivity = (index: number) => {
		setDraft((d) => ({
			...d,
			upcomingActivities: (d.upcomingActivities ?? []).filter((_, i) => i !== index),
		}));
	};

	const addActivity = () => {
		setDraft((d) => ({
			...d,
			upcomingActivities: [
				...(d.upcomingActivities ?? []),
				{
					title: "New Activity",
					date: "TBD",
					description: "Describe what students can expect.",
				},
			],
		}));
	};

	return (
		<TeacherDashboardLayout activePage="resources">
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="space-y-1">
								<CardTitle className="text-xl">{draft.name}</CardTitle>
								<CardDescription>{draft.category}</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Club name</Label>
								<Input
									value={draft.name}
									onChange={(e) => {
										const name = e.target.value;
										setDraft((d) => ({
											...d,
											name,
											slug: updateSlugForName(name),
										}));
									}}
								/>
							</div>

							<div className="space-y-2">
								<Label>Category</Label>
								<Input
									value={draft.category}
									onChange={(e) =>
										setDraft((d) => ({ ...d, category: e.target.value }))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Image URL</Label>
								<Input
									value={draft.image}
									onChange={(e) =>
										setDraft((d) => ({ ...d, image: e.target.value }))
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
									value={draft.description}
									onChange={(e) =>
										setDraft((d) => ({ ...d, description: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Long description</Label>
								<textarea
									className={textareaClassName}
									rows={3}
									value={draft.longDescription}
									onChange={(e) =>
										setDraft((d) => ({ ...d, longDescription: e.target.value }))
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
									value={draft.members}
									onChange={(e) => {
										const next = Number.parseInt(e.target.value, 10);
										setDraft((d) => ({
											...d,
											members: Number.isNaN(next) ? 0 : next,
										}));
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label>Next meeting</Label>
								<Input
									value={draft.nextMeeting}
									onChange={(e) =>
										setDraft((d) => ({ ...d, nextMeeting: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Location</Label>
								<Input
									value={draft.location}
									onChange={(e) =>
										setDraft((d) => ({ ...d, location: e.target.value }))
									}
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Advisor name</Label>
								<Input
									value={draft.advisor}
									onChange={(e) =>
										setDraft((d) => ({ ...d, advisor: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Advisor contact email</Label>
								<Input
									type="email"
									value={draft.contactEmail}
									onChange={(e) =>
										setDraft((d) => ({ ...d, contactEmail: e.target.value }))
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Requirements</Label>
							<textarea
								className={textareaClassName}
								rows={2}
								value={draft.requirements ?? ""}
								onChange={(e) =>
									setDraft((d) => ({ ...d, requirements: e.target.value }))
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
									value={(draft.highlights ?? []).join("\n")}
									onChange={(e) =>
										setDraft((d) => ({
											...d,
											highlights: e.target.value
												.split("\n")
												.map((s) => s.trim())
												.filter(Boolean),
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Tags (comma separated)</Label>
								<Input
									value={(draft.tags ?? []).join(", ")}
									onChange={(e) =>
										setDraft((d) => ({
											...d,
											tags: e.target.value
												.split(",")
												.map((t) => t.trim())
												.filter(Boolean),
										}))
									}
									placeholder="Leadership, Service, STEM"
								/>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Switch
									checked={draft.featured ?? false}
									onCheckedChange={(checked) =>
										setDraft((d) => ({ ...d, featured: checked }))
									}
									id={`featured-${draft.id}`}
								/>
								<Label htmlFor={`featured-${draft.id}`} className="text-sm">
									Show on student dashboard hero cards
								</Label>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between gap-2">
									<h4 className="font-medium">Upcoming activities</h4>
									<Button size="sm" variant="outline" onClick={addActivity}>
										Add activity
									</Button>
								</div>

								{(draft.upcomingActivities ?? []).length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No upcoming events yet. Add your first meeting or activity.
									</p>
								) : (
									<div className="space-y-3">
										{draft.upcomingActivities!.map((activity, index) => (
											<div
												key={`${draft.id}-activity-${index}`}
												className="rounded-lg border p-3 space-y-2">
												<div className="grid gap-2 md:grid-cols-2">
													<div className="space-y-1">
														<Label>Title</Label>
														<Input
															value={activity.title}
															onChange={(e) =>
																updateActivity(index, {
																	title: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-1">
														<Label>Date</Label>
														<Input
															value={activity.date}
															onChange={(e) =>
																updateActivity(index, {
																	date: e.target.value,
																})
															}
															placeholder="Nov 14"
														/>
													</div>
												</div>
												<div className="space-y-1">
													<Label>Description</Label>
													<textarea
														className={textareaClassName}
														rows={2}
														value={activity.description}
														onChange={(e) =>
															updateActivity(index, {
																description: e.target.value,
															})
														}
													/>
												</div>
												<div className="flex justify-end">
													<Button
														variant="ghost"
														size="sm"
														className="text-destructive"
														onClick={() => removeActivity(index)}>
														Remove
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</CardContent>

					<CardFooter className="flex flex-wrap gap-2">
						<Button onClick={handleCreateClub}>Create Club</Button>
						<Button
							variant="destructive"
							onClick={() => navigate(`/teacher/home/resources/`)}>
							Cancel
						</Button>
					</CardFooter>
				</Card>
			</div>
		</TeacherDashboardLayout>
	);
}
