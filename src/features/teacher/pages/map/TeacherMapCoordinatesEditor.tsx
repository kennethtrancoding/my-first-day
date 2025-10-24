import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMap, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MAP_LABEL_TYPE_COLORS } from "@/constants";
import { mentors } from "@/people";
import type { Person } from "@/people";
import { useStoredState } from "@/hooks/useStoredState";
import { buildingCoords, type RoomData } from "@/features/shared/pages/map/buildingCoords";
import TeacherOverlayPanel from "@/components/ui/teacherMapOverlayPanel";
import { loadMapRooms, saveMapRooms } from "@/utils/teacherData";

const DefaultIcon = L.icon({
	iconUrl,
	shadowUrl: iconShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});
(L.Marker.prototype as any).options.icon = DefaultIcon;

const vertexIcon = L.divIcon({
	className: "vertex-handle leaflet-div-icon",
	html: '<div style="width:12px;height:12px;border:2px solid #fff;box-shadow:0 0 0 2px #000;border-radius:2px;"></div>',
	iconSize: [16, 16],
	iconAnchor: [8, 8],
});

type SelectedRoomDetail = {
	room: string;
	roomType?: string;
	displayType?: string;
	department?: string;
	contactName?: string;
	contactRole?: string;
	onSchedule: boolean;
	period?: number;
	typeColor: string;
};
type TeacherRoomType = Record<string, Person>;

function ZoomControlBottomLeft() {
	const map = useMap();
	useEffect(() => {
		const zoom = L.control.zoom({ position: "bottomleft" });
		map.addControl(zoom);
		return () => {
			map.removeControl(zoom);
		};
	}, [map]);
	return null;
}

function normalize(s: string | undefined) {
	return (s ?? "").trim().toLowerCase();
}

export default function TeacherMapCoordinatesEditor() {
	const mapRef = useRef<L.Map | null>(null);
	const polyRefs = useRef<Record<string, L.Polygon>>({});

	// Rooms are now the permanent truth in localStorage.
	// Seed from buildingCoords on first load.
	const [rooms, setRooms] = useStoredState<RoomData[]>("teacher:mapRooms", () =>
		loadMapRooms(buildingCoords)
	);

	// Persist whenever rooms change
	useEffect(() => {
		saveMapRooms(rooms);
	}, [rooms]);

	const allTypes = useMemo(() => {
		const set = new Set<string>();
		rooms.forEach((b) => set.add(b.type ?? "Unknown"));
		return Array.from(set).sort();
	}, [rooms]);

	const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set(allTypes));
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

	const toggleType = (t: string) => {
		setSelectedTypes((prev) => {
			const next = new Set(prev);
			if (next.has(t)) next.delete(t);
			else next.add(t);
			return next;
		});
	};

	const getTypeColor = useCallback(
		(t?: string) =>
			MAP_LABEL_TYPE_COLORS[t as keyof typeof MAP_LABEL_TYPE_COLORS] ??
			MAP_LABEL_TYPE_COLORS.default,
		[]
	);

	const visibleRooms = useMemo(() => {
		return rooms.filter((b) => {
			const typeKey = b.type ?? "Unknown";
			return selectedTypes.has(typeKey);
		});
	}, [rooms, selectedTypes]);

	// stable key that changes when coordinates change
	const coordsKey = (roomLabel: string, coords: L.LatLngTuple[]) =>
		`${roomLabel}-${coords.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";")}`;

	// Imperative visual update while dragging (smooth morph)
	function updatePolygonVisual(roomLabel: string, idx: number, lat: number, lng: number) {
		const poly = polyRefs.current[roomLabel];
		if (!poly) return;
		const latlngs = poly.getLatLngs() as L.LatLng[] | L.LatLng[][];
		const ring = Array.isArray(latlngs[0])
			? (latlngs[0] as L.LatLng[])
			: (latlngs as L.LatLng[]);
		if (!ring?.length || idx < 0 || idx >= ring.length) return;
		const clone = ring.slice();
		clone[idx] = L.latLng(lat, lng);
		poly.setLatLngs([clone]);
	}

	// Commit a vertex move to the permanent rooms array
	function updateVertex(roomKey: any, idx: number, coord: { lat: number; lng: number }) {
		// Resolve label (we may receive plain label or coordsKey)
		const resolveLabel = (): string | undefined => {
			if (typeof roomKey === "string") {
				if (rooms.some((r) => r.room === roomKey)) return roomKey;
				const found = rooms.find(
					(r) =>
						coordsKey(r.room, r.coordinates) === roomKey ||
						roomKey.startsWith(`${r.room}-`)
				);
				if (found) return found.room;
			} else if (roomKey && typeof roomKey === "object" && "room" in roomKey) {
				return (roomKey as any).room;
			}
			return undefined;
		};

		const roomLabel = resolveLabel();
		if (!roomLabel) return;

		setRooms((prev) => {
			const i = prev.findIndex((r) => r.room === roomLabel);
			if (i === -1) return prev;
			const next = prev.slice();
			const coords = next[i].coordinates.map((c) => [...c] as [number, number]);
			if (idx < 0 || idx >= coords.length) return prev;
			coords[idx] = [coord.lat, coord.lng];
			next[i] = { ...next[i], coordinates: coords };
			return next;
		});
	}

	// Map instance capture
	const whenCreated = (map: L.Map) => {
		mapRef.current = map;
	};

	// Add a room near map center with a small square; persist to rooms
	const onAddRoom = useCallback(() => {
		const roomId = (window.prompt("New room label (e.g., A123):") || "").trim();
		if (!roomId) return;

		if (rooms.some((r) => r.room === roomId)) {
			window.alert(`Room "${roomId}" already exists.`);
			return;
		}

		const type = (window.prompt("Room type (optional):") || "").trim() || undefined;

		const map = mapRef.current;
		const center = map?.getCenter() ?? L.latLng(34.0545, -117.9011);
		const dLat = 0.00003;
		const dLng = 0.00003;
		const square: [number, number][] = [
			[center.lat - dLat, center.lng - dLng],
			[center.lat - dLat, center.lng + dLng],
			[center.lat + dLat, center.lng + dLng],
			[center.lat + dLat, center.lng - dLng],
		];

		const newRoom: RoomData = {
			room: roomId,
			type,
			scheduleSubject: undefined,
			coordinates: square,
		};

		setRooms((prev) => [...prev, newRoom]);
		setSelectedRoom(roomId);
	}, [rooms]);

	// Permanently delete the selected room from the truth store
	const onRemoveRoom = useCallback(() => {
		if (!selectedRoom) {
			window.alert("Select a room first (click its polygon).");
			return;
		}
		setRooms((prev) => prev.filter((r) => r.room !== selectedRoom));
		setSelectedRoom(null);
	}, [selectedRoom]);

	const peopleByRoom = useMemo<TeacherRoomType>(() => {
		const result: TeacherRoomType = {};
		mentors.forEach((person) => {
			if (person.type === "teacher" && person.roomNumber) {
				result[normalize(person.roomNumber)] = person;
			}
		});
		return result;
	}, []);

	return (
		<>
			<TeacherOverlayPanel
				onToggleType={toggleType}
				allTypes={allTypes}
				selectedTypes={selectedTypes}
				getTypeColor={getTypeColor}
				onAddRoom={onAddRoom}
				onRemoveRoom={onRemoveRoom}
				selectedRoom={selectedRoom}
			/>

			<MapContainer
				center={[34.0545, -117.9011]}
				zoom={19}
				maxZoom={22}
				scrollWheelZoom
				zoomControl={false}
				style={{ height: "100vh", width: "100%" }}>
				<ZoomControlBottomLeft />

				<TileLayer
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
					attribution=""
					maxZoom={19}
					maxNativeZoom={19}
					minZoom={2}
				/>

				{visibleRooms.map((b) => {
					const typeColor = getTypeColor(b.type);
					const isSelected = b.room === selectedRoom;
					const k = coordsKey(b.room, b.coordinates);

					return (
						<React.Fragment key={k}>
							<Polygon
								key={k}
								positions={b.coordinates as L.LatLngExpression[]}
								ref={(el) => {
									if (el) polyRefs.current[b.room] = el;
								}}
								pathOptions={{
									color: typeColor,
									fillColor: typeColor,
									fillOpacity: isSelected ? 0.6 : 0.35,
									weight: isSelected ? 3 : 2,
								}}
								eventHandlers={{
									click: (e) => {
										setSelectedRoom(b.room);
										const teacher = peopleByRoom[normalize(b.room)];
										const popupContent = `
                      <div style="font-family: sans-serif; line-height: 1.4;">
                        <h3 style="margin: 0 0 4px 0;">Room ${b.room}</h3>
                        ${b.type ? `Type: ${b.type}<br/>` : ""}
                        ${teacher ? `Teacher: ${teacher.name}<br/>` : ""}
                        ${
							teacher && teacher.department
								? `Subject: ${teacher.department}<br/>`
								: ""
						}
                      </div>`;
										(e.target as L.Polygon)
											.bindPopup(popupContent, { maxWidth: 260 })
											.openPopup((e as any).latlng);
									},
								}}
							/>

							{b.coordinates.map((coord, idx) => (
								<Marker
									key={`${k}-${idx}`}
									position={coord as [number, number]}
									draggable
									pane="markerPane"
									zIndexOffset={1000}
									icon={vertexIcon}
									eventHandlers={{
										drag: (e) => {
											const ll = e.target.getLatLng();
											updatePolygonVisual(b.room, idx, ll.lat, ll.lng);
										},
										dragend: (e) => {
											const ll = e.target.getLatLng();
											updateVertex(b.room, idx, { lat: ll.lat, lng: ll.lng });
										},
									}}
								/>
							))}
						</React.Fragment>
					);
				})}
			</MapContainer>
		</>
	);
}
