export type ElectiveCourse = {
	name: string;
	grades: string;
	description: string;
	focusAreas?: string[];
};

export type ElectiveCategory = {
	id: string;
	title: string;
	tagline: string;
	courses: ElectiveCourse[];
};

export const electiveCategories: ElectiveCategory[] = [
	{
		id: "stem",
		title: "STEM & Innovation",
		tagline: "Hands-on labs for makers, coders, and builders.",
		courses: [
			{
				name: "Robotics Engineering Lab",
				grades: "Grades 7-8",
				description:
					"Design, prototype, and compete with autonomous robots using LEGO Spike Prime and VEX systems.",
				focusAreas: ["Engineering", "Problem Solving"],
			},
			{
				name: "App Design Studio",
				grades: "Grades 7-8",
				description:
					"Learn UX fundamentals and build mobile-ready prototypes with React and Swift Playgrounds.",
				focusAreas: ["Coding", "Design Thinking"],
			},
			{
				name: "Environmental Science Explorations",
				grades: "Grades 6-7",
				description:
					"Investigate local ecosystems, collect field data, and propose sustainability solutions for campus.",
				focusAreas: ["Field Research", "Data Literacy"],
			},
		],
	},
	{
		id: "arts",
		title: "Visual & Performing Arts",
		tagline: "Amplify your voice on stage, on screen, or on canvas.",
		courses: [
			{
				name: "Digital Media Production",
				grades: "Grades 6-8",
				description:
					"Create broadcast-ready videos with green screen effects, audio mixing, and motion graphics.",
				focusAreas: ["Storytelling", "Media Editing"],
			},
			{
				name: "Studio Art & Illustration",
				grades: "Grades 6-8",
				description:
					"Experiment with mixed media, digital illustration tablets, and collaborative mural projects.",
				focusAreas: ["Visual Arts", "Portfolio Building"],
			},
			{
				name: "Show Choir & Performance Workshop",
				grades: "Grades 6-8",
				description:
					"Blend vocal training with choreography and stage presence for seasonal performances.",
				focusAreas: ["Performance", "Collaboration"],
			},
		],
	},
	{
		id: "leadership",
		title: "Leadership & Communications",
		tagline: "Grow as a communicator, organizer, and changemaker.",
		courses: [
			{
				name: "AVID College Readiness",
				grades: "Grades 7-8",
				description:
					"Develop academic strategies, public speaking skills, and college-prep habits through AVID modules.",
				focusAreas: ["Presentation", "Organization"],
			},
			{
				name: "Yearbook & Publication Design",
				grades: "Grades 6-8",
				description:
					"Plan the annual yearbook with Adobe Creative Cloud, photography, and journalistic writing.",
				focusAreas: ["Design", "Editorial"],
			},
			{
				name: "Broadcast Journalism",
				grades: "Grades 7-8",
				description:
					"Report campus news, conduct interviews, and anchor morning announcements from our studio.",
				focusAreas: ["Media", "Leadership"],
			},
		],
	},
];
