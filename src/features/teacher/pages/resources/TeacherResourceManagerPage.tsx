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
import { useStoredState } from "@/hooks/useStoredState";
import TeacherDashboardLayout from "@/features/teacher/components/TeacherDashboardLayout";
import {
	filterResourcesByAudience,
	type TeacherResource,
	type TeacherResourceAudience,
} from "@/utils/teacherData";
import { cn } from "@/lib/utils";

const audiences: { value: TeacherResourceAudience; label: string }[] = [
	{ value: "student", label: "Students" },
	{ value: "mentor", label: "Mentors" },
	{ value: "both", label: "Students & Mentors" },
];

const textareaClassName =
	"flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px]";

const emptyDraft: Omit<TeacherResource, "id" | "updatedAt"> = {
	title: "",
	description: "",
	url: "",
	audience: "student",
};

function TeacherResourceManagerPage() {
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

		const normalizedUrl = draft.url.startsWith("http")
			? draft.url
			: `https://${draft.url}`;

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
		<TeacherDashboardLayout activePage="resources">
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
										setDraft((prev) => ({ ...prev, description: event.target.value }))
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
											variant={draft.audience === aud.value ? "default" : "outline"}
											onClick={() => setDraft((prev) => ({ ...prev, audience: aud.value }))}
										>
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
									Reset
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
										<Button variant="outline" size="sm" onClick={() => handleEdit(resource)}>
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
							{hasStudentFacing ? "Students" : "No students"} currently see shared resources.
						</span>
						<span>
							{hasMentorFacing ? "Mentors" : "No mentors"} currently see shared resources.
						</span>
					</div>
				</div>
			</div>
		</TeacherDashboardLayout>
	);
}

export default TeacherResourceManagerPage;
