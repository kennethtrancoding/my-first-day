import type { RoomData } from "@/features/shared/pages/map/buildingCoords";
import { readFromStorage, writeToStorage, removeFromStorage } from "@/utils/storage";

export type TeacherResourceAudience = "student" | "mentor" | "both";

export interface TeacherResource {
	id: string;
	title: string;
	description: string;
	url: string;
	audience: TeacherResourceAudience;
	updatedAt: string;
}

export type TeacherResourceStore = TeacherResource[];

const TEACHER_RESOURCES_KEY = "teacher:resources";

export function filterResourcesByAudience(
	resources: TeacherResource[],
	target: "student" | "mentor"
) {
	return resources.filter((item) => item.audience === "both" || item.audience === target);
}

export function loadTeacherResources(): TeacherResource[] {
	return readFromStorage<TeacherResourceStore>(TEACHER_RESOURCES_KEY, []);
}

export function saveTeacherResources(resources: TeacherResource[]) {
	writeToStorage(TEACHER_RESOURCES_KEY, resources);
}

export type MapRoomsStore = RoomData[];

const TEACHER_MAP_ROOMS_KEY = "teacher:mapRooms";

export function loadMapRooms(initialRooms: readonly RoomData[]): RoomData[] {
	const stored = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	if (stored && Array.isArray(stored) && stored.length > 0) return stored.slice();
	const seeded = initialRooms.map((r) => ({ ...r }));
	writeToStorage(TEACHER_MAP_ROOMS_KEY, seeded);
	return seeded;
}

export function saveMapRooms(rooms: RoomData[]): void {
	writeToStorage(TEACHER_MAP_ROOMS_KEY, rooms);
}

export function getRoomIdSet(rooms: readonly RoomData[]): Set<string> {
	return new Set(rooms.map((r) => r.room));
}

export function upsertRoom(room: RoomData): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === room.room);
	const next = rooms.slice();
	if (idx >= 0) next[idx] = { ...room };
	else next.push({ ...room });
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

export function updateRoomCoordinates(roomId: string, coordinates: [number, number][]): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === roomId);
	if (idx === -1) return rooms;
	const next = rooms.slice();
	next[idx] = { ...next[idx], coordinates: coordinates.map((c) => [...c] as [number, number]) };
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

export function updateRoomMeta(
	roomId: string,
	updates: Partial<Pick<RoomData, "type" | "scheduleSubject">> & Record<string, unknown>
): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === roomId);
	if (idx === -1) return rooms;
	const next = rooms.slice();
	next[idx] = { ...next[idx], ...updates };
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

export function deleteRoom(roomId: string): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const next = rooms.filter((r) => r.room !== roomId);
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

export function renameRoom(oldRoomId: string, newRoomId: string): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === oldRoomId);
	if (idx === -1) return rooms;
	if (rooms.some((r) => r.room === newRoomId)) return rooms;
	const next = rooms.slice();
	next[idx] = { ...next[idx], room: newRoomId };
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

const LEGACY_OVERRIDES_KEY = "teacher:mapOverrides";

type LegacyOverride = {
	type?: string;
	scheduleSubject?: string;
	notes?: string;
	coordinates?: [number, number][];
	deleted?: boolean;
};
type LegacyOverrideStore = Record<string, LegacyOverride>;

export function migrateLegacyOverridesIfPresent(baseRooms: readonly RoomData[]): void {
	const legacy = readFromStorage<LegacyOverrideStore>(LEGACY_OVERRIDES_KEY, {});
	const hasLegacy = legacy && typeof legacy === "object" && Object.keys(legacy).length > 0;
	if (!hasLegacy) return;

	const baseMap = new Map(baseRooms.map((r) => [r.room, r]));
	const merged: RoomData[] = [];

	for (const room of baseRooms) {
		const o = legacy[room.room];
		if (o?.deleted) continue;
		merged.push({
			...room,
			type: o?.type ?? room.type,
			scheduleSubject: o?.scheduleSubject ?? room.scheduleSubject,
			coordinates: o?.coordinates ?? room.coordinates,
		});
	}

	for (const [roomId, o] of Object.entries(legacy)) {
		if (o?.deleted) continue;
		if (!baseMap.has(roomId) && o.coordinates && o.coordinates.length >= 3) {
			merged.push({
				room: roomId,
				type: o.type ?? "Unknown",
				scheduleSubject: o.scheduleSubject,
				coordinates: o.coordinates,
			} as RoomData);
		}
	}

	writeToStorage(TEACHER_MAP_ROOMS_KEY, merged);
	removeFromStorage(LEGACY_OVERRIDES_KEY);
}
