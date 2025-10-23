import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { buildingCoords } from "./buildingCoords";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import OverlayPanel from "@/components/ui/mapOverlayPanel";
import { MAP_LABEL_TYPE_COLORS } from "@/constants";
import { mentors } from "@/people";
import type { Person } from "@/people";
import { findAccount, getCurrentEmail } from "@/utils/auth";
const DefaultIcon = L.icon({
	iconUrl,
	shadowUrl: iconShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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

export default function CampusMap() {
	const schedule = useMemo(() => {
		const currentEmail = getCurrentEmail();
		const account = findAccount(currentEmail);
		const schedule = account.profile.schedule || [];
		return { account, schedule, currentEmail };
	}, []).schedule;

	function getPeriodForRoom(roomName: string) {
		const idx = schedule.indexOf(roomName);
		return idx >= 0 ? idx + 1 : undefined;
	}

	const peopleByRoom = useMemo<TeacherRoomType>(() => {
		const result: TeacherRoomType = {};
		mentors.forEach((person) => {
			if (person.type === "teacher" && person.roomNumber) {
				result[normalize(person.roomNumber)] = person;
			}
		});
		return result;
	}, []);

	const allTypes = useMemo(() => {
		const set = new Set<string>();
		buildingCoords.forEach((b) => set.add(b.type ?? "Unknown"));
		return Array.from(set).sort();
	}, []);

	const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set(allTypes));
	const [showScheduleOnly, setShowScheduleOnly] = useState(false);
	const [selectedRoomDetail, setSelectedRoomDetail] = useState<SelectedRoomDetail | null>(null);

	const toggleType = (t: string) => {
		setSelectedTypes((prev) => {
			const next = new Set(prev);
			if (next.has(t)) next.delete(t);
			else next.add(t);
			return next;
		});
	};

	function isOnSchedule(roomName: string) {
		return getPeriodForRoom(roomName) !== undefined;
	}

	const getTypeColor = useCallback(
		(t?: string) =>
			MAP_LABEL_TYPE_COLORS[t as keyof typeof MAP_LABEL_TYPE_COLORS] ??
			MAP_LABEL_TYPE_COLORS.default,
		[]
	);

	const visibleRooms = useMemo(() => {
		return buildingCoords.filter((b) => {
			const typeKey = b.type ?? "Unknown";
			const typeOk = selectedTypes.has(typeKey);
			const onSchedule = isOnSchedule(b.room);
			return typeOk && (!showScheduleOnly || onSchedule);
		});
	}, [selectedTypes, showScheduleOnly, isOnSchedule]);

	useEffect(() => {
		if (!selectedRoomDetail) return;
		const stillVisible = visibleRooms.some(
			(b) => normalize(b.room) === normalize(selectedRoomDetail.room ?? "")
		);
		if (!stillVisible) {
			setSelectedRoomDetail(null);
		}
	}, [visibleRooms, selectedRoomDetail]);

	const scheduleDetail = useMemo(() => {
		return schedule
			.map((roomName, i) => {
				const normalizedRoom = normalize(roomName);
				const found = buildingCoords.find((b) => normalize(b.room) === normalizedRoom);
				const person = peopleByRoom[normalizedRoom];
				const period = getPeriodForRoom(roomName) ?? i + 1;
				const typeLabel = person
					? person.type === "teacher"
						? "Teacher"
						: "Peer Mentor"
					: found?.type ?? "Unknown";
				return {
					period,
					room: roomName,
					type: typeLabel,
					department: person?.department,
					teacher: person?.name,
					color: getTypeColor(found?.type),
				};
			})
			.sort((a, b) => a.period - b.period);
	}, [peopleByRoom, getTypeColor]);

	return (
		<>
			<OverlayPanel
				allTypes={allTypes}
				selectedTypes={selectedTypes}
				onToggleType={toggleType}
				showScheduleOnly={showScheduleOnly}
				onChangeShowScheduleOnly={setShowScheduleOnly}
				scheduleDetail={scheduleDetail}
				getTypeColor={getTypeColor}
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
					const onSchedule = isOnSchedule(b.room);

					return (
						<Polygon
							key={b.room}
							positions={b.coordinates}
							pathOptions={{
								color: onSchedule ? "orange" : typeColor,
								fillColor: typeColor,
								fillOpacity: 0.4,
								weight: onSchedule ? 4 : 2,
							}}
							eventHandlers={{
								click: (e) => {
									const idx = schedule.findIndex((entry) => {
										const e1 = normalize(entry);
										const r1 = normalize(b.room);
										return e1 === r1;
									});
									const period = idx >= 0 ? idx + 1 : undefined;

									const teacher = peopleByRoom[normalize(b.room)];
									const popupContent = `
                    <div style="font-family: sans-serif; line-height: 1.4;">
                      <h3 style="margin: 0 0 4px 0;">Room ${b.room}</h3>
                      ${b.type ? `Type: ${b.type}<br/>` : ""}
                      ${teacher ? `Teacher: ${teacher.name}<br/>` : ""}
                      ${teacher && teacher.department ? `Subject: ${teacher.department}<br/>` : ""}
                      ${
							period !== undefined
								? `Period: ${period}`
								: onSchedule
								? `On Schedule`
								: ""
						}
                    </div>
                  `;

									(e.target as L.Polygon)
										.bindPopup(popupContent, { maxWidth: 260 })
										.openPopup((e as any).latlng);
								},
								mouseover: (e) =>
									(e.target as L.Polygon).setStyle({ fillOpacity: 0.7 }),
								mouseout: (e) =>
									(e.target as L.Polygon).setStyle({ fillOpacity: 0.4 }),
							}}
						/>
					);
				})}
			</MapContainer>
		</>
	);
}
