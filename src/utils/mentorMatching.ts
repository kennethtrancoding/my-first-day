import { mentors, type Person } from "@/utils/people";
import { interestOptions } from "@/utils/data";

export type MentorMatch = {
	mentor: Person;
	score: number;
};

export type MentorMatchOptions = {
	limit?: number;
	people?: Person[];
};

export type MentorMatchProfile = {
	grade?: string | number;
	interests?: string[];
};

const interestKeywordSeeds: Record<string, string[]> = {
	Robotics: ["robot", "robotics", "makerspace", "engineering", "stem"],
	Coding: ["coding", "program", "software", "code", "developer", "hackathon", "tech"],
	"Math Team": ["math", "mathematics", "algebra", "geometry", "calculus"],
	"Art & Design": ["art", "design", "creative", "illustration", "visual", "studio"],
	Yearbook: ["yearbook", "layout", "publishing", "editor", "spread"],
	Journalism: ["journalism", "newspaper", "report", "writing", "storytelling"],
	Soccer: ["soccer", "futbol", "football club"],
	Basketball: ["basketball", "hoops"],
	Volleyball: ["volleyball"],
	Esports: ["esports", "gaming", "game", "stream"],
	Music: ["music", "musician", "choir", "compose"],
	Band: ["band", "jazz", "instrument", "rehearsal", "ensemble"],
	Gardening: ["garden", "gardening", "plants"],
	"3D Printing": ["3d printing", "maker", "fabrication", "cad", "prototype"],
	Photography: ["photo", "photography", "camera"],
	Debate: ["debate", "speech", "public speaking", "argument"],
	"Science Fair": ["science", "lab", "experiment", "science fair"],
	Chess: ["chess"],
};

const normalizedInterestLookup = new Map(
	interestOptions.map((label) => [normalizeInterest(label), label])
);

const interestKeywordMap = Object.entries(interestKeywordSeeds).reduce<Record<string, string[]>>(
	(acc, [label, words]) => {
		acc[normalizeInterest(label)] = words;
		return acc;
	},
	{}
);

function normalizeInterest(label: string) {
	return label
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function getKeywordsForInterest(interestKey: string) {
	return interestKeywordMap[interestKey] ?? [interestKey];
}

function describeInterest(interestKey: string) {
	return normalizedInterestLookup.get(interestKey) ?? interestKey;
}

function buildMentorHaystack(mentor: Person) {
	return `${mentor.bio} ${mentor.department ?? ""}`.toLowerCase();
}

function parseGrade(grade?: string | number) {
	if (typeof grade === "number") return Number.isNaN(grade) ? null : grade;
	if (typeof grade === "string") {
		const parsed = Number.parseInt(grade, 10);
		return Number.isNaN(parsed) ? null : parsed;
	}
	return null;
}

function scoreMentor(mentor: Person, normalizedInterests: string[], gradeNumber: number | null) {
	const haystack = buildMentorHaystack(mentor);
	const reasons: string[] = [];
	let score = mentor.type === "peer" ? 4 : 3;

	let matchedInterestCount = 0;
	normalizedInterests.forEach((interest) => {
		const keywords = getKeywordsForInterest(interest);
		if (keywords.some((keyword) => haystack.includes(keyword))) {
			matchedInterestCount += 1;
			score += mentor.type === "peer" ? 3 : 2;
			reasons.push(`Shares your interest in ${describeInterest(interest)}`);
		}
	});

	if (matchedInterestCount === 0 && normalizedInterests.length > 0) {
		score -= 1;
	}

	if (mentor.type === "peer" && gradeNumber != null && mentor.grade != null) {
		const difference = Math.abs(mentor.grade - gradeNumber);
		if (difference === 0) {
			score += 2;
			reasons.push("Same grade level");
		} else if (difference === 1) {
			score += 1;
			reasons.push("Close in grade");
		}
	}

	if (mentor.hasConnected) {
		score += 0.25;
	}

	return {
		score: Math.max(score, 0),
		reasons,
	};
}

export function matchMentorsForStudent(
	profile?: MentorMatchProfile,
	options: MentorMatchOptions = { limit: 1 }
): MentorMatch[] {
	const people = options?.people ?? mentors;
	const normalizedInterests = (profile?.interests ?? [])
		.map((interest) => normalizeInterest(interest))
		.filter(Boolean);

	const gradeNumber = parseGrade(profile?.grade);

	const scored = people.map((person) => {
		const evaluation = scoreMentor(person, normalizedInterests, gradeNumber);
		return {
			mentor: person,
			...evaluation,
		};
	});

	scored.sort((a, b) => {
		if (b.score !== a.score) {
			return b.score - a.score;
		}
		if (a.mentor.type !== b.mentor.type) {
			return a.mentor.type === "peer" ? -1 : 1;
		}
		return a.mentor.id - b.mentor.id;
	});

	const limit = options?.limit ?? scored.length;
	return scored.slice(0, limit);
}

export function getMatchedMentorIds(profile?: MentorMatchProfile, options?: MentorMatchOptions) {
	return matchMentorsForStudent(profile, options).map((entry) => entry.mentor.id);
}
