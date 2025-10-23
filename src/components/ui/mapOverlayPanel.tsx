import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type ScheduleItem = {
	period: number;
	room: string;
	type: string;
	department?: string;
	teacher?: string;
	color: string;
};

export interface OverlayPanelProps {
	allTypes: string[];
	selectedTypes: Set<string>;
	onToggleType: (type: string) => void;
	showScheduleOnly: boolean;
	onChangeShowScheduleOnly: (value: boolean) => void;
	scheduleDetail: ScheduleItem[];
	getTypeColor: (type?: string) => string;
}

export default function OverlayPanel(props: OverlayPanelProps) {
	const {
		allTypes,
		selectedTypes,
		onToggleType,
		showScheduleOnly,
		onChangeShowScheduleOnly,
		scheduleDetail,
		getTypeColor,
	} = props;

	return (
		<div className="fixed top-4 left-4 z-[1000] w-[22rem] max-w-[90vw]">
			<Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
				<CardHeader>
					<CardTitle>Map Options</CardTitle>
					<CardDescription>Filter rooms and view your class schedule.</CardDescription>
				</CardHeader>

				<CardContent className="p-6 pt-0 grid gap-6">
					<div className="flex items-center gap-2 select-none">
						<Checkbox
							id="show-schedule-only"
							checked={showScheduleOnly}
							onCheckedChange={(v) => onChangeShowScheduleOnly(Boolean(v))}
						/>
						<Label htmlFor="show-schedule-only" className="text-sm cursor-pointer">
							Show only schedule
						</Label>
					</div>

					<div>
						<div className="text-sm font-medium text-foreground mb-2">Room Types</div>

						<div className="relative">
							<div className="max-h-40 overflow-auto pr-1 scrollbar-always rounded-md border bg-background">
								<div className="grid gap-2 p-1">
									{allTypes.map((t) => {
										const id = `type-${t
											.replace(/[^a-z0-9]/gi, "-")
											.toLowerCase()}`;
										const checked = selectedTypes.has(t);
										return (
											<div
												key={t}
												className="flex items-center gap-2"
												title={t}>
												<Checkbox
													id={id}
													checked={checked}
													onCheckedChange={() => onToggleType(t)}
												/>
												<span
													className="inline-block h-3 w-3 rounded border"
													style={{
														background: getTypeColor(t),
														borderColor: "rgba(0,0,0,0.2)",
													}}
												/>
												<Label
													htmlFor={id}
													className="text-sm cursor-pointer">
													{t}
												</Label>
											</div>
										);
									})}
								</div>
								<br />
							</div>

							<div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent rounded-b-md" />
						</div>
					</div>

					<div>
						<div className="text-sm font-medium text-foreground mb-2">Legend</div>
						<div className="flex items-center gap-2 mb-1">
							<span
								className="inline-block h-3 w-3 rounded border"
								style={{ background: "orange", borderColor: "rgba(0,0,0,0.2)" }}
							/>
							<span className="text-sm">On schedule (outline)</span>
						</div>
						<div className="text-sm text-muted-foreground">
							Fill color indicates the room's type.
						</div>
					</div>

					<div>
						<div className="text-sm font-semibold text-foreground mb-2">
							Class Schedule
						</div>
						<ol className="flex flex-col gap-3">
							{scheduleDetail.map((s) => (
								<li key={`${s.period}-${s.room}`} className="leading-tight">
									<div className="flex flex-row gap-2">
										<span className="font-medium">Period {s.period}:</span>
										<span>{s.room}</span>
									</div>
									<div className="flex text-xs text-muted-foreground mt-1 items-center gap-1">
										<span
											className="inline-block h-3 w-3 rounded-sm border mr-1 align-[2px]"
											style={{
												background: s.color,
												borderColor: "rgba(0,0,0,0.2)",
											}}
										/>
										{s.type}
										{s.department ? ` • ${s.department}` : ""}
										{s.teacher ? ` • ${s.teacher}` : ""}
									</div>
								</li>
							))}
						</ol>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
