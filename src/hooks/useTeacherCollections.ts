import { useStoredState } from "@/hooks/useStoredState";
import {
	electiveCategories as electiveSeeds,
	type ElectiveCategory,
} from "@/data/electives";
import { clubDirectory as clubSeeds, type Club } from "@/constants";

export const TEACHER_ELECTIVES_KEY = "teacher:electives";
export const TEACHER_CLUBS_KEY = "teacher:clubs";

function cloneElectiveSeeds(): ElectiveCategory[] {
	return electiveSeeds.map((category) => ({
		...category,
		courses: category.courses.map((course) => ({
			...course,
			focusAreas: course.focusAreas ? [...course.focusAreas] : undefined,
		})),
	}));
}

function cloneClubSeeds(): Club[] {
	return clubSeeds.map((club) => ({
		...club,
		highlights: club.highlights ? [...club.highlights] : [],
		upcomingActivities: club.upcomingActivities
			? club.upcomingActivities.map((activity) => ({ ...activity }))
			: [],
		tags: club.tags ? [...club.tags] : [],
	}));
}

export function useTeacherElectives() {
	return useStoredState<ElectiveCategory[]>(TEACHER_ELECTIVES_KEY, () => cloneElectiveSeeds());
}

export function useTeacherClubs() {
	return useStoredState<Club[]>(TEACHER_CLUBS_KEY, () => cloneClubSeeds());
}
