// teacherData.ts
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

/* -------------------------------- Resources -------------------------------- */

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

// Permanent truth key
const TEACHER_MAP_ROOMS_KEY = "teacher:mapRooms";

export function loadMapRooms(initialRooms: readonly RoomData[]): RoomData[] {
	const stored = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	if (stored && Array.isArray(stored) && stored.length > 0) return stored.slice();
	// Seed from precanned data
	const seeded = initialRooms.map((r) => ({ ...r }));
	writeToStorage(TEACHER_MAP_ROOMS_KEY, seeded);
	return seeded;
}

/** Save the entire rooms list (overwrites the truth). */
export function saveMapRooms(rooms: RoomData[]): void {
	writeToStorage(TEACHER_MAP_ROOMS_KEY, rooms);
}

/** Convenience: get a quick Set of room ids in the current store. */
export function getRoomIdSet(rooms: readonly RoomData[]): Set<string> {
	return new Set(rooms.map((r) => r.room));
}

/** Upsert a room by `room` id; if it exists, replace; otherwise, add. */
export function upsertRoom(room: RoomData): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === room.room);
	const next = rooms.slice();
	if (idx >= 0) next[idx] = { ...room };
	else next.push({ ...room });
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

/** Update coordinates for a room (no-op if not found). */
export function updateRoomCoordinates(roomId: string, coordinates: [number, number][]): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === roomId);
	if (idx === -1) return rooms;
	const next = rooms.slice();
	next[idx] = { ...next[idx], coordinates: coordinates.map((c) => [...c] as [number, number]) };
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

/** Update metadata (type, scheduleSubject, etc.) for a room. */
export function updateRoomMeta(
	roomId: string,
	updates: Partial<Pick<RoomData, "type" | "scheduleSubject">> & Record<string, unknown> // allow future fields
): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === roomId);
	if (idx === -1) return rooms;
	const next = rooms.slice();
	next[idx] = { ...next[idx], ...updates };
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

/** Permanently delete a room from the truth store. */
export function deleteRoom(roomId: string): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const next = rooms.filter((r) => r.room !== roomId);
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

/** Rename a room id (e.g., "A101" -> "A101A"). No-op if source not found. */
export function renameRoom(oldRoomId: string, newRoomId: string): RoomData[] {
	const rooms = readFromStorage<MapRoomsStore>(TEACHER_MAP_ROOMS_KEY, [] as RoomData[]);
	const idx = rooms.findIndex((r) => r.room === oldRoomId);
	if (idx === -1) return rooms;
	// If destination exists, you may want to merge or abort. Here we abort to avoid conflicts.
	if (rooms.some((r) => r.room === newRoomId)) return rooms;
	const next = rooms.slice();
	next[idx] = { ...next[idx], room: newRoomId };
	writeToStorage(TEACHER_MAP_ROOMS_KEY, next);
	return next;
}

/* -------------------------- Optional: One-time migration -------------------------- */
/**
 * If you previously used overrides and want to migrate existing edits:
 *  - It reads overrides from the old key.
 *  - Applies them to `baseRooms`.
 *  - Saves the merged rooms to the permanent truth key.
 *  - Removes the old overrides key.
 *
 * Call this ONCE on app start (before calling `loadMapRooms`) if you want automatic migration.
 */
const LEGACY_OVERRIDES_KEY = "teacher:mapOverrides"; // old key

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

	// Build a map of base rooms for easy lookup
	const baseMap = new Map(baseRooms.map((r) => [r.room, r]));
	const merged: RoomData[] = [];

	// 1) Start with base rooms; apply legacy except those marked deleted
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

	// 2) Add override-only rooms (not deleted)
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

	// 3) Save merged set as the new permanent truth and remove legacy key
	writeToStorage(TEACHER_MAP_ROOMS_KEY, merged);
	removeFromStorage(LEGACY_OVERRIDES_KEY);
}
