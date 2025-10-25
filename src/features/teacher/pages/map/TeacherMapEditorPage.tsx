import * as React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TeacherDashboardLayout from "@/features/teacher/components/TeacherDashboardLayout";
import { useStoredState } from "@/hooks/useStoredState";
import { buildingCoords, type RoomData } from "@/features/shared/pages/map/buildingCoords";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { loadMapRooms, saveMapRooms } from "@/utils/teacherData";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type NotesStore = Record<string, string>;

const NOTES_KEY = "teacher:roomNotes";

function useRoomNotes() {
	const [notesByRoom, setNotesByRoom, clearNotes] = useStoredState<NotesStore>(NOTES_KEY, {});
	return { notesByRoom, setNotesByRoom, clearNotes };
}

type Draft = {
	type: string;
	scheduleSubject: string;
	notes: string;
};

const EMPTY_DRAFT: Draft = {
	type: "",
	scheduleSubject: "",
	notes: "",
};

function TeacherMapEditorPage() {
	const navigate = useNavigate();
	const [rooms, setRooms] = useStoredState<RoomData[]>("teacher:mapRooms", () =>
		loadMapRooms(buildingCoords)
	);

	React.useEffect(() => {
		saveMapRooms(rooms);
	}, [rooms]);

	const { notesByRoom, setNotesByRoom, clearNotes } = useRoomNotes();

	const sortedRooms = React.useMemo(() => {
		return [...rooms].sort((a, b) =>
			a.room.localeCompare(b.room, undefined, { numeric: true, sensitivity: "base" })
		);
	}, [rooms]);

	const [search, setSearch] = React.useState("");
	const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(
		sortedRooms[0]?.room ?? null
	);
	const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);

	const filteredRooms = React.useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return sortedRooms;
		return sortedRooms.filter((room) => {
			return (
				room.room.toLowerCase().includes(query) ||
				(room.type ?? "").toLowerCase().includes(query) ||
				(room.scheduleSubject ?? "").toLowerCase().includes(query)
			);
		});
	}, [sortedRooms, search]);

	React.useEffect(() => {
		if (!filteredRooms.some((room) => room.room === selectedRoomId)) {
			setSelectedRoomId(filteredRooms[0]?.room ?? null);
		}
	}, [filteredRooms, selectedRoomId]);

	const selectedRoom = React.useMemo<RoomData | null>(() => {
		if (!selectedRoomId) return null;
		return rooms.find((room) => room.room === selectedRoomId) ?? null;
	}, [rooms, selectedRoomId]);

	const effectiveRoom = selectedRoom;

	React.useEffect(() => {
		if (!selectedRoom) {
			setDraft(EMPTY_DRAFT);
			return;
		}
		setDraft({
			type: selectedRoom.type ?? "",
			scheduleSubject: selectedRoom.scheduleSubject ?? "",
			notes: notesByRoom[selectedRoom.room] ?? "",
		});
	}, [selectedRoom, notesByRoom]);

	function handleSave() {
		if (!selectedRoom) return;

		const trimmedType = draft.type.trim();
		const trimmedSubject = draft.scheduleSubject.trim();
		const trimmedNotes = draft.notes.trim();

		setRooms((prev) => {
			const idx = prev.findIndex((r) => r.room === selectedRoom.room);
			if (idx === -1) return prev;
			const next = prev.slice();
			next[idx] = {
				...next[idx],
				type: trimmedType || undefined,
				scheduleSubject: trimmedSubject || undefined,
			};
			return next;
		});

		setNotesByRoom((prev) => ({
			...prev,
			[selectedRoom.room]: trimmedNotes,
		}));
	}

	function handleResetAll() {
		setRooms(buildingCoords.map((r) => ({ ...r })));
		clearNotes();
		setDraft(EMPTY_DRAFT);
	}

	return (
		<TeacherDashboardLayout activePage="map">
			<div className="grid gap-6 lg:grid-cols:[260px_1fr] lg:grid-cols-[260px_1fr]">
				<Card className="h-full">
					<CardHeader>
						<CardTitle>Select a location</CardTitle>
						<CardDescription>
							Choose a classroom or space to update the labels that appear on the
							campus map.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Input
							placeholder="Search rooms or subjects"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
						<ScrollArea className="h-[420px] pr-2">
							<div className="flex flex-col gap-2">
								{filteredRooms.map((room) => {
									const isSelected = room.room === selectedRoomId;
									const hasCustom =
										(room.type ?? "") !==
											(buildingCoords.find((b) => b.room === room.room)
												?.type ?? "") ||
										(room.scheduleSubject ?? "") !==
											(buildingCoords.find((b) => b.room === room.room)
												?.scheduleSubject ?? "") ||
										Boolean(notesByRoom[room.room]);

									return (
										<button
											key={room.room}
											type="button"
											onClick={() => setSelectedRoomId(room.room)}
											className={cn(
												"flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition",
												isSelected
													? "border-primary bg-primary/10"
													: "border-border"
											)}>
											<span className="font-medium">Room {room.room}</span>
											<span className="text-xs text-muted-foreground">
												{room.type ?? "Unlabeled space"}
											</span>
											{hasCustom && (
												<span className="text-[10px] uppercase tracking-wide text-primary">
													Customized
												</span>
											)}
										</button>
									);
								})}
							</div>
						</ScrollArea>
					</CardContent>
					<CardFooter className="flex flex-col gap-2">
						<Button
							variant="ghost"
							className="text-destructive"
							onClick={handleResetAll}
							disabled={rooms.length === 0}
							title="Reset all labels to the original seed data and clear staff notes">
							Reset all labels to default
						</Button>
					</CardFooter>
				</Card>

				{selectedRoom && effectiveRoom ? (
					<Card>
						<CardHeader>
							<CardTitle>Room {effectiveRoom.room}</CardTitle>
							<CardDescription>
								Preview how this room appears on the campus map. Save to apply
								changes for all students.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-2">
								<Label htmlFor="room-type">Room type</Label>
								<Input
									id="room-type"
									placeholder="Classroom, Office, Lab..."
									value={draft.type}
									onChange={(event) =>
										setDraft((prev) => ({ ...prev, type: event.target.value }))
									}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="room-subject">Schedule label</Label>
								<Input
									id="room-subject"
									placeholder="Robotics Lab"
									value={draft.scheduleSubject}
									onChange={(event) =>
										setDraft((prev) => ({
											...prev,
											scheduleSubject: event.target.value,
										}))
									}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="room-notes">Teacher notes (optional)</Label>
								<textarea
									id="room-notes"
									placeholder="Leave context for other staff members."
									value={draft.notes}
									onChange={(event) =>
										setDraft((prev) => ({ ...prev, notes: event.target.value }))
									}
									rows={4}
									className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px]"
								/>
							</div>

							<div className="grid gap-2 rounded-md border bg-muted/40 p-4 text-sm">
								<p>
									<strong>Current map label:</strong>{" "}
									{effectiveRoom.type ?? "Unlabeled"}
								</p>
								<p>
									<strong>Schedule subject:</strong>{" "}
									{effectiveRoom.scheduleSubject ?? "—"}
								</p>
								{draft.notes && (
									<p>
										<strong>Staff notes:</strong> {draft.notes}
									</p>
								)}
							</div>
						</CardContent>
						<CardFooter className="flex flex-wrap gap-2">
							<Button onClick={handleSave}>Save changes</Button>
						</CardFooter>
					</Card>
				) : (
					<Card className="border-dashed">
						<CardContent className="p-6 text-center text-muted-foreground">
							Select a room to edit its labels.
						</CardContent>
					</Card>
				)}
			</div>
			<Button className="mt-4" onClick={() => navigate("/teacher/home/map/coordinates/")}>
				Edit room coordinates <ArrowRight size={16} className="ml-2" />
			</Button>
		</TeacherDashboardLayout>
	);
}

export default TeacherMapEditorPage;
