import { Checkbox } from "@radix-ui/react-checkbox";
import { Label } from "@radix-ui/react-label";
import { ArrowLeft } from "lucide-react";
import { CardHeader, CardTitle, Card, CardContent } from "./card";
import { Button } from "./button";

export interface TeacherOverlayPanelProps {
	allTypes: string[];
	selectedTypes: Set<string>;
	onToggleType: (type: string) => void;
	getTypeColor: (type?: string) => string;
	onAddRoom: () => void;
	onRemoveRoom: () => void;

	selectedRoom?: string | null;
	onBack?: () => void;
}

export default function TeacherOverlayPanel(props: TeacherOverlayPanelProps) {
	const {
		allTypes,
		selectedTypes,
		onToggleType,
		getTypeColor,
		onAddRoom,
		onRemoveRoom,
		selectedRoom,
		onBack,
	} = props;

	return (
		<div className="fixed top-4 left-4 z-[1000] w-[22rem] max-w-[90vw]">
			<Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
				<CardHeader>
					<div className="flex items-center gap-3">
						{onBack && (
							<button
								type="button"
								onClick={onBack}
								className="px-1 py-1 rounded-md border hover:bg-accent">
								<ArrowLeft size={16} />
							</button>
						)}
						<CardTitle>Teacher Map Tools</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-6 pt-0 grid gap-6">
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
					<div className="flex gap-1">
						<Button
							type="button"
							onClick={onAddRoom}
							className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
							title="Add a new room polygon at the current map center">
							Add Room
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={onRemoveRoom}
							disabled={!selectedRoom}
							className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
							title={
								selectedRoom
									? `Delete room ${selectedRoom}`
									: "Select a room to delete"
							}>
							Delete Room
						</Button>
					</div>
					<p className="text-sm muted-foreground">Shift + Drag to move a room.</p>
					<p className="text-sm muted-foreground">
						Double click on an edge to add a new vertex. Double click a vertex to remove
						it.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
