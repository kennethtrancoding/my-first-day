import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { electiveCategories } from "@/data/electives";
import { useTeacherElectives } from "@/hooks/useTeacherCollections";

type ElectiveListProps = {
	heading: string;
	intro?: string;
};

const DEFAULT_INTRO =
	"Explore elective pathways that let you dive deeper into what inspires you. Talk with your counselor to confirm availability and placement.";

export function ElectiveList({ heading, intro = DEFAULT_INTRO }: ElectiveListProps) {
	const [managedElectives] = useTeacherElectives();
	const categories = React.useMemo(() => {
		if (managedElectives.length > 0) {
			return managedElectives;
		}
		return electiveCategories;
	}, [managedElectives]);

	return (
		<div className="space-y-10">
			<div className="space-y-2 max-w-2xl">
				<h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
				<p className="text-muted-foreground">{intro}</p>
			</div>

			{categories.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="p-6 text-center text-muted-foreground">
						Elective data hasn’t been published yet. Check back soon for updated offerings.
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6">
					{categories.map((category) => (
						<Card key={category.id} className="shadow-sm">
							<CardHeader>
								<CardTitle>{category.title}</CardTitle>
								<CardDescription>{category.tagline}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{category.courses.map((course, index) => (
									<div
										key={`${category.id}-${index}-${course.name}`}
										className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-3">
										<div className="flex flex-wrap items-start justify-between gap-2">
											<p className="font-medium text-base">{course.name}</p>
											<span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
												{course.grades}
											</span>
										</div>
										<p className="text-sm leading-relaxed text-muted-foreground">
											{course.description}
										</p>
										{course.focusAreas?.length ? (
											<div className="flex flex-wrap gap-2">
												{course.focusAreas.map((area) => (
													<Badge key={`${course.name}-${area}`} variant="outline">
														{area}
													</Badge>
												))}
											</div>
										) : null}
									</div>
								))}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
