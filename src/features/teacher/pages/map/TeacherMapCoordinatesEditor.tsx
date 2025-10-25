import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMap, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { icon } from "leaflet";

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

const iconSize = 14;
const vertexIcon = L.divIcon({
	className: "vertex-handle leaflet-div-icon",
	html: `<div style="
		width:${iconSize}px;
		height:${iconSize}px;
		"></div>`,

	iconSize: [iconSize, iconSize],
	iconAnchor: [iconSize / 2, iconSize / 2],
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
	// Add marker refs to keep references to vertex markers so we can move them during polygon drag
	const markerRefs = useRef<Record<string, (L.Marker | null)[]>>({});

	const [rooms, setRooms] = useStoredState<RoomData[]>("teacher:mapRooms", () =>
		loadMapRooms(buildingCoords)
	);

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

	const coordsKey = (roomLabel: string, coords: L.LatLngTuple[]) =>
		`${roomLabel}-${coords.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";")}`;

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
	function dot(v1: L.Point, v2: L.Point) {
		return v1.x * v2.x + v1.y * v2.y;
	}
	function nearestSegment(room: RoomData, p: L.LatLng, map: L.Map) {
		let best = { idx: -1, dist: Infinity, point: p } as {
			idx: number;
			dist: number;
			point: L.LatLng;
		};
		const project = (ll: L.LatLng) => map.latLngToLayerPoint(ll);
		const unproject = (pt: L.Point) => map.layerPointToLatLng(pt);
		const coords = room.coordinates;
		for (let i = 0; i < coords.length; i++) {
			const a = L.latLng(coords[i][0], coords[i][1]);
			const b = L.latLng(
				coords[(i + 1) % coords.length][0],
				coords[(i + 1) % coords.length][1]
			);
			const P = project(p),
				A = project(a),
				B = project(b);
			const AB = B.subtract(A);
			const denom = AB.x * AB.x + AB.y * AB.y || 1;
			const t = Math.max(0, Math.min(1, dot(P.subtract(A), AB) / denom));
			const proj = new L.Point(A.x + AB.x * t, A.y + AB.y * t);
			const projLL = unproject(proj);
			const d = p.distanceTo(projLL);
			if (d < best.dist) best = { idx: i, dist: d, point: projLL };
		}
		return best;
	}

	function updateVertex(roomKey: any, idx: number, coord: { lat: number; lng: number }) {
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

	const onRemoveRoom = useCallback(() => {
		if (!selectedRoom) {
			window.alert("Select a room first (click its polygon).");
			return;
		}
		// cleanup marker refs for the removed room
		delete markerRefs.current[selectedRoom];
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
				onBack={() => history.back()}
			/>

			<MapContainer
				center={[34.0545, -117.9011]}
				zoom={19}
				maxZoom={22}
				scrollWheelZoom
				zoomControl={false}
				doubleClickZoom={false}
				boxZoom={false}
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

									mousedown: (e) => {
										if (!e.originalEvent.shiftKey) return;
										e.originalEvent.preventDefault();

										const map = e.target._map;
										const start = map.latLngToLayerPoint(e.latlng);

										const poly = polyRefs.current[b.room];
										if (!poly) return;

										let latlngs = poly.getLatLngs();
										const ring = Array.isArray(latlngs[0])
											? (latlngs[0] as L.LatLng[])
											: (latlngs as L.LatLng[]);
										if (!ring?.length) return;

										const originalPoints = ring.map((pt) =>
											map.latLngToLayerPoint(pt)
										);

										const moveHandler = (moveEvent: L.LeafletMouseEvent) => {
											const currentPosition = map.latLngToLayerPoint(
												moveEvent.latlng
											);
											const delta = currentPosition.subtract(start);

											const moved = originalPoints.map((pt) =>
												map.layerPointToLatLng(pt.add(delta))
											);

											poly.setLatLngs([moved]);

											const markersForRoom = markerRefs.current[b.room] || [];
											for (let j = 0; j < moved.length; j++) {
												const m = markersForRoom[j];
												if (m && (m as any).setLatLng) {
													(m as any).setLatLng(moved[j]);
												}
											}

											latlngs = moved;
										};

										const upHandler = (upEvent: L.LeafletMouseEvent) => {
											map.off("mousemove", moveHandler);
											map.off("mouseup", upHandler);

											const currentPosition = map.latLngToLayerPoint(
												upEvent.latlng
											);
											const delta = currentPosition.subtract(start);

											setRooms((prev) => {
												const i = prev.findIndex((r) => r.room === b.room);
												if (i === -1) return prev;
												const next = prev.slice();
												const coords = originalPoints.map((pt) => {
													const ll = map.layerPointToLatLng(
														pt.add(delta)
													);
													return [ll.lat, ll.lng] as [number, number];
												});
												next[i] = { ...next[i], coordinates: coords };
												return next;
											});
										};

										map.on("mousemove", moveHandler);
										map.on("mouseup", upHandler);
									},

									dblclick: (e: any) => {
										nearestSegment(b, e.latlng, e.target._map);
										const { idx: bestIdx, point: bestPoint } = nearestSegment(
											b,
											e.latlng,
											e.target._map
										);
										if (bestIdx >= 0) {
											setRooms((prev) => {
												const i = prev.findIndex((r) => r.room === b.room);
												if (i === -1) return prev;
												const next = prev.slice();
												const coords = next[i].coordinates.map(
													(c) => [...c] as [number, number]
												);
												coords.splice(bestIdx + 1, 0, [
													bestPoint.lat,
													bestPoint.lng,
												]);
												next[i] = { ...next[i], coordinates: coords };
												return next;
											});
										}
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
									// keep a ref to each vertex marker so it can be moved during polygon drag
									ref={(el) => {
										markerRefs.current[b.room] =
											markerRefs.current[b.room] || [];
										markerRefs.current[b.room][idx] =
											el as unknown as L.Marker | null;
									}}
									eventHandlers={{
										drag: (e) => {
											const ll = e.target.getLatLng();
											updatePolygonVisual(b.room, idx, ll.lat, ll.lng);
										},
										dragend: (e) => {
											const ll = e.target.getLatLng();
											updateVertex(b.room, idx, { lat: ll.lat, lng: ll.lng });
										},
										dblclick: (e) => {
											e.originalEvent.preventDefault();
											e.originalEvent.stopPropagation();

											setRooms((prev) => {
												const i = prev.findIndex((r) => r.room === b.room);
												if (i === -1) return prev;
												const next = prev.slice();
												const coords = next[i].coordinates.map(
													(c) => [...c] as [number, number]
												);
												if (coords.length <= 3) {
													return prev;
												}
												coords.splice(idx, 1);
												next[i] = { ...next[i], coordinates: coords };
												return next;
											});
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
