import { Map as MapIcon, FileText, BookOpen, Users, Info, Settings, Library } from "lucide-react";
import type { NavigateFunction } from "react-router-dom";
import { mentors } from "@/people";
import type { Person } from "@/people";
import { buildingCoords, type RoomData } from "@/pages/Map/buildingCoords";

export const upcomingEvents = [
	{
		id: 1,
		title: "Sixth Grade Orientation",
		time: "October 15, 9:00 AM",
		place: "Gymnasium",
	},
	{ id: 2, title: "Club Rush", time: "October 20, 12:00 PM", place: "East Quad" },
];

type ClubActivity = {
	title: string;
	date: string;
	description: string;
};

export type Club = {
	id: number;
	slug: string;
	name: string;
	category: string;
	description: string;
	longDescription: string;
	members: number;
	nextMeeting: string;
	location: string;
	advisor: string;
	contactEmail: string;
	advisorId?: number;
	advisorProfile?: Person;
	locationRoom?: string;
	locationData?: RoomData;
	color: string;
	image: string;
	highlights: string[];
	upcomingActivities: ClubActivity[];
	requirements?: string;
	featured?: boolean;
	tags?: string[];
};

type ClubSeed = Omit<
	Club,
	| "advisor"
	| "contactEmail"
	| "location"
	| "advisorProfile"
	| "locationData"
	| "advisorId"
	| "locationRoom"
> & {
	advisorId: number;
	locationRoom: string;
	contactEmail?: string;
};

const teacherLookup = new Map<number, Person>(
	mentors
		.filter((person) => person.type === "teacher")
		.map((person) => [person.id, person])
);

const roomLookup = new Map<string, RoomData>(buildingCoords.map((room) => [room.room, room]));

const formatClubLocation = (room?: RoomData) => {
	if (!room) {
		return "Location coming soon";
	}

	return /^\d/.test(room.room) ? `Room ${room.room}` : room.room;
};

const clubDirectorySeeds: ClubSeed[] = [
	{
		id: 1,
		slug: "robotics-club",
		name: "Robotics Club",
		description: "Build robots, compete in tournaments, and learn coding",
		members: 45,
		nextMeeting: "Wednesday 3:30 PM",
		category: "STEM",
		color: "bg-gradient-primary",
		image: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2342",
		longDescription:
			"Design, build, and program competition-ready robots while developing teamwork and problem-solving skills. Members collaborate in build teams, learn to use CAD and coding tools, and prepare for VEX Robotics challenges throughout the year.",
		locationRoom: "32",
		advisorId: 11,
		highlights: [
			"Hands-on robot building sessions with experienced mentors",
			"Weekly programming labs focused on sensors and automation",
			"Field trips to local engineering firms and university labs",
		],
		upcomingActivities: [
			{
				title: "VEX Tournament Prep Night",
				date: "Oct 28",
				description: "Finalize competition robot design and practice autonomous routines.",
			},
			{
				title: "Guest Speaker: Robotics Engineer",
				date: "Nov 6",
				description: "Learn about real-world robotics careers and ask your questions.",
			},
		],
		requirements: "Open to all grades, no experience required—bring your curiosity!",
		featured: true,
		tags: ["Engineering", "Coding", "Competition"],
	},
	{
		id: 2,
		slug: "student-council",
		name: "Student Council",
		description: "Lead school initiatives and represent student voices",
		members: 28,
		nextMeeting: "Friday 12:00 PM",
		category: "Leadership",
		color: "bg-gradient-secondary",
		image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Shape school culture by planning events, supporting student initiatives, and collaborating with administrators. Council members lead committees, manage campus-wide projects, and ensure every student has a voice.",
		locationRoom: "Counseling",
		advisorId: 12,
		highlights: [
			"Coordinate school-wide rallies, dances, and spirit weeks",
			"Develop leadership skills through workshops and mentorship",
			"Participate in community service and outreach projects",
		],
		upcomingActivities: [
			{
				title: "Winter Spirit Week Planning",
				date: "Nov 4",
				description: "Brainstorm themes and finalize activity schedule for December.",
			},
			{
				title: "Student Feedback Forum",
				date: "Nov 12",
				description: "Gather feedback from classmates to present to administration.",
			},
		],
		requirements: "Open to 6th–8th graders; elections held each fall for officer positions.",
		tags: ["Leadership", "Event Planning", "Service"],
	},
	{
		id: 3,
		slug: "photography-club",
		name: "Photography Club",
		description: "Capture memories and develop creative photography skills",
		members: 62,
		nextMeeting: "Monday 4:00 PM",
		category: "Arts",
		color: "bg-accent",
		image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Explore storytelling through the lens with guided photo walks, editing labs, and collaborative projects. Members build portfolios, learn shooting techniques, and contribute to school publications.",
		locationRoom: "3",
		advisorId: 13,
		highlights: [
			"Weekly themed photo challenges to spark creativity",
			"Lightroom and Photoshop editing workshops in the media lab",
			"Opportunities to photograph school events and publish work",
		],
		upcomingActivities: [
			{
				title: "Golden Hour Photo Walk",
				date: "Oct 30",
				description:
					"Capture the best natural light on campus with guidance from club leaders.",
			},
			{
				title: "Editing Lab: Portrait Retouching",
				date: "Nov 8",
				description:
					"Hands-on session focused on lighting, color balance, and storytelling.",
			},
		],
		requirements: "Bring a camera or smartphone. No prior experience needed.",
		featured: true,
		tags: ["Creative", "Storytelling", "Media"],
	},
	{
		id: 4,
		slug: "debate-team",
		name: "Debate Team",
		description: "Develop critical thinking and public speaking skills",
		members: 34,
		nextMeeting: "Thursday 3:00 PM",
		category: "Academic",
		color: "bg-primary",
		image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Master persuasive speaking, research techniques, and effective teamwork in competitive debate formats. Members learn to analyze current events, craft compelling arguments, and compete in league tournaments.",
		locationRoom: "15B",
		advisorId: 14,
		highlights: [
			"Weekly practice rounds with peer feedback and coaching",
			"Workshops on research, argument structure, and rebuttals",
			"Travel opportunities to regional middle school tournaments",
		],
		upcomingActivities: [
			{
				title: "Mock Tournament: Policy Debate",
				date: "Nov 1",
				description: "Pair up for scrimmage rounds to prepare for the fall invitational.",
			},
			{
				title: "Research Workshop",
				date: "Nov 10",
				description: "Learn how to build evidence files and cite sources effectively.",
			},
		],
		requirements: "Open to all grade levels. Attend one practice before competing.",
		featured: true,
		tags: ["Public Speaking", "Current Events", "Competition"],
	},
	{
		id: 5,
		slug: "jazz-band",
		name: "Jazz Band",
		description: "Perform jazz standards and modern arrangements at school events.",
		members: 22,
		nextMeeting: "Tue & Thu 7:15 AM",
		category: "Music & Performing Arts",
		color: "bg-secondary",
		image: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Grow as a musician through rehearsals focused on improvisation, ensemble balance, and jazz theory. The band performs at concerts, festivals, and community events throughout the year.",
		locationRoom: "Multi-Purpose Room",
		advisorId: 15,
		highlights: [
			"Collaborate with guest musicians for masterclasses and clinics",
			"Perform at the district jazz showcase and winter concerts",
			"Record a spring EP featuring student arrangements",
		],
		upcomingActivities: [
			{
				title: "Jazz Improv Workshop",
				date: "Nov 5",
				description: "Guest saxophonist leads drills on soloing and trading fours.",
			},
			{
				title: "Holiday Concert Dress Rehearsal",
				date: "Dec 3",
				description: "Full run-through with sound check and lighting cues.",
			},
		],
		requirements: "Auditions held each fall; prior instrument experience recommended.",
		tags: ["Music", "Performance", "Teamwork"],
	},
	{
		id: 6,
		slug: "environmental-alliance",
		name: "Environmental Alliance",
		description: "Create sustainability projects that make campus greener.",
		members: 40,
		nextMeeting: "Wednesday 3:15 PM",
		category: "Service & Leadership",
		color: "bg-accent",
		image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Lead campus sustainability initiatives, from waste reduction campaigns to native plant gardens. Members research environmental issues, design outreach materials, and present proposals to school leadership.",
		locationRoom: "West Quad",
		advisorId: 16,
		highlights: [
			"Maintain the campus pollinator garden and compost hub",
			"Run awareness campaigns during Earth Week and beyond",
			"Collaborate with city partners on community clean-ups",
		],
		upcomingActivities: [
			{
				title: "Garden Volunteer Day",
				date: "Oct 26",
				description: "Mulch, plant winter vegetables, and install new signage.",
			},
			{
				title: "Recycling Audit",
				date: "Nov 9",
				description: "Audit classroom bins and present recommendations to administration.",
			},
		],
		requirements: "Open to all grades. Bring clothes you don’t mind getting a little dirty!",
		tags: ["Sustainability", "Outreach", "Science"],
	},
	{
		id: 7,
		slug: "coding-and-app-lab",
		name: "Coding & App Lab",
		description: "Build apps, websites, and games using modern tools.",
		members: 55,
		nextMeeting: "Monday 3:30 PM",
		category: "STEM",
		color: "bg-primary",
		image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Prototype real-world solutions with code. Members learn front-end design, logic, and user testing while shipping projects ranging from school apps to creative games.",
		locationRoom: "18",
		advisorId: 17,
		highlights: [
			"Weekly build nights covering JavaScript, Python, and no-code tools",
			"Pitch project ideas at quarterly demo days",
			"Collaborate with local developers for mentorship sessions",
		],
		upcomingActivities: [
			{
				title: "App Design Sprint",
				date: "Nov 2",
				description: "Form teams to wireframe and prototype a campus helper app.",
			},
			{
				title: "Intro to Game Development",
				date: "Nov 16",
				description: "Create your first platformer with beginner-friendly tools.",
			},
		],
		requirements: "Laptop recommended. Beginners welcome—bring a friend!",
		tags: ["Technology", "Design", "Problem Solving"],
	},
	{
		id: 8,
		slug: "theater-arts-coalition",
		name: "Theater Arts Coalition",
		description: "Bring stories to life on stage and behind the scenes.",
		members: 48,
		nextMeeting: "Thursday 3:45 PM",
		category: "Arts & Expression",
		color: "bg-gradient-secondary",
		image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Act, direct, design sets, or manage backstage operations for school productions. Members rotate through workshops covering acting, script analysis, stagecraft, and technical design.",
		locationRoom: "Gym",
		advisorId: 18,
		highlights: [
			"Seasonal productions with student-led crews",
			"Workshops on improv, stage combat, and vocal projection",
			"Opportunities to shadow professional theater technicians",
		],
		upcomingActivities: [
			{
				title: "Auditions: Winter Play",
				date: "Nov 7",
				description: "Monologues and cold reads for the upcoming production.",
			},
			{
				title: "Set Design Build Day",
				date: "Nov 18",
				description: "Construct and paint scenic elements in the shop.",
			},
		],
		requirements: "Open casting. Tech crew sign-ups available for all skill levels.",
		tags: ["Performance", "Production", "Creative"],
	},
	{
		id: 9,
		slug: "makerspace-collective",
		name: "Makerspace Collective",
		description: "Experiment with 3D printing, woodworking, and wearable tech.",
		members: 37,
		nextMeeting: "Friday 3:20 PM",
		category: "Innovation & Design",
		color: "bg-gradient-primary",
		image: "https://images.unsplash.com/photo-1563520240533-66480a3916fe?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340",
		longDescription:
			"Iterate on hands-on builds while learning fabrication fundamentals. Members tackle themed design challenges, prototype with digital fabrication tools, and showcase creations at the spring expo.",
		locationRoom: "31",
		advisorId: 19,
		highlights: [
			"Access to 3D printers, laser cutters, and sewing machines",
			"Monthly design challenges with prizes for creativity",
			"Cross-club collaborations with art, robotics, and STEM teams",
		],
		upcomingActivities: [
			{
				title: "Wearable Tech Lab",
				date: "Oct 31",
				description: "Sew LED circuits into custom-designed accessories.",
			},
			{
				title: "Mini Hackathon: Upcycle Challenge",
				date: "Nov 14",
				description: "Transform recycled materials into functional prototypes.",
			},
		],
		requirements: "Space is limited to keep the lab safe—RSVP each week in advance.",
		tags: ["Hands-on", "Engineering", "Art"],
	},
	{
		id: 10,
		slug: "multicultural-alliance",
		name: "Multicultural Alliance",
		description: "Celebrate cultures and plan inclusive campus events.",
		members: 50,
		nextMeeting: "Tuesday 3:30 PM",
		category: "Community & Belonging",
		color: "bg-primary",
		image: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Share traditions, plan cultural showcases, and lead dialogues that build empathy. Members host food fairs, panel discussions, and peer education workshops focused on global awareness.",
		locationRoom: "15",
		advisorId: 20,
		highlights: [
			"Organize the annual Culture Night with student performances",
			"Lead advisory lessons centered on inclusion and identity",
			"Partner with language classes on international exchange projects",
		],
		upcomingActivities: [
			{
				title: "Festival of Lights Planning",
				date: "Nov 3",
				description: "Design booths and performances for December's celebration.",
			},
			{
				title: "Story Circles Workshop",
				date: "Nov 20",
				description: "Facilitate student-led discussions on belonging.",
			},
		],
		requirements: "All are welcome—bring a story, recipe, or tradition to share.",
		tags: ["Inclusion", "Events", "Leadership"],
	},
	{
		id: 11,
		slug: "stem-network",
		name: "STEM Network",
		description: "Connect with mentors and explore STEM pathways.",
		members: 32,
		nextMeeting: "Thursday 3:30 PM",
		category: "STEM",
		color: "bg-secondary",
		image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Build confidence in science, technology, and engineering through mentorship, hands-on labs, and field trips. Members collaborate on passion projects and hear from women working in STEM careers.",
		locationRoom: "16",
		advisorId: 21,
		highlights: [
			"Monthly mentorship circles with high school and industry partners",
			"Hands-on labs exploring physics, coding, and biomedical science",
			"Leadership roles planning STEM outreach for younger students",
		],
		upcomingActivities: [
			{
				title: "STEM Career Night",
				date: "Nov 8",
				description: "Panel featuring engineers, researchers, and designers.",
			},
			{
				title: "Arduino Wearables Lab",
				date: "Nov 22",
				description: "Program wearable tech that lights up with motion sensors.",
			},
		],
		requirements: "Open to any students interested in STEM.",
		tags: ["Mentorship", "STEM"],
	},
	{
		id: 12,
		slug: "outdoor-adventure-club",
		name: "Outdoor Adventure Club",
		description: "Explore local trails while learning outdoor skills.",
		members: 27,
		nextMeeting: "Friday 7:30 AM",
		category: "Health & Wellness",
		color: "bg-accent",
		image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=80",
		longDescription:
			"Discover nearby parks through hikes, orienteering, and stewardship projects. Members learn outdoor safety, plan weekend excursions, and document their adventures for the school community.",
		locationRoom: "North Quad",
		advisorId: 22,
		highlights: [
			"Monthly sunrise hikes with trail photography challenges",
			"Workshops on map reading, packing essentials, and Leave No Trace",
			"Service days partnering with park rangers on habitat restoration",
		],
		upcomingActivities: [
			{
				title: "Walnut Creek Trail Clean-Up",
				date: "Oct 27",
				description: "Collect litter and log wildlife sightings for the ranger station.",
			},
			{
				title: "Sunrise Summit Hike",
				date: "Nov 17",
				description: "Pre-dawn meetup for a moderate hike and breakfast picnic.",
			},
		],
		requirements: "Parent permission required for off-campus hikes; gear loaners available.",
		tags: ["Outdoors", "Fitness", "Service"],
	},
];

export const clubDirectory: Club[] = clubDirectorySeeds.map((club) => {
	const advisor = teacherLookup.get(club.advisorId);
	const locationData = roomLookup.get(club.locationRoom);
	const baseLocation = formatClubLocation(locationData);
	const contactEmail = advisor?.email ?? club.contactEmail ?? "";
	const location = baseLocation || "Location coming soon";

	return {
		...club,
		advisor: advisor?.name ?? "Advisor coming soon",
		contactEmail: contactEmail || "info@wcusd.org",
		advisorProfile: advisor,
		location: location || "Location coming soon",
		locationData,
	};
});

export const featuredClubs = clubDirectory.filter((club) => club.featured);

export const MAP_LABEL_TYPE_COLORS: Record<string, string> = {
	Classroom: "#1f77b4",
	Lab: "#2ca02c",
	Office: "#9467bd",
	Gymnasium: "#d62728",
	Cafeteria: "#ff7f0e",
	"Outdoor Area": "#8c564b",
	Restroom: "#fcba03",
	default: "#7f7f7f",
	Library: "#42f5c5",
};
export const interestOptions = [
	"Robotics",
	"Coding",
	"Math Team",
	"Art & Design",
	"Yearbook",
	"Journalism",
	"Soccer",
	"Basketball",
	"Volleyball",
	"Esports",
	"Music",
	"Band",
	"Gardening",
	"3D Printing",
	"Photography",
	"Debate",
	"Science Fair",
	"Chess",
];

export const createMainResources = (navigate: NavigateFunction) => [
	{
		title: "Campus Map & Navigation",
		description: "Find your classrooms, facilities, and nearest exits.",
		icon: MapIcon,
		buttonText: "View Campus Map",
		onclick: () => navigate("/home/resources/map"),
	},
	{
		title: "Student Handbook 2024-2025",
		description: "Official guide to school policies, codes of conduct, and academic rules.",
		icon: FileText,
		buttonText: "Download PDF",
		onclick: () =>
			window.open(
				"https://resources.finalsite.net/images/v1756159775/wcusdorg/uq6hpinbifmfoojgtiyb/Parent_Student_Handbook_2025-26_FINAL_-English_07-17-2025_1.pdf"
			),
	},
	{
		title: "Academic Course Catalog",
		description:
			"Detailed descriptions of all courses, prerequisites, and graduation requirements.",
		icon: BookOpen,
		buttonText: "Browse Courses",
		onclick: () => alert("Course catalog coming soon!"),
	},
];

export const createHelpAndSupport = (navigate: NavigateFunction) => [
	{
		title: "Meet the Staff Directory",
		description: "Contact information for teachers, counselors, and administration.",
		icon: Users,
		buttonText: "View Directory",
		onclick: () => window.open("https://hms.wcusd.org/directory"),
	},
	{
		title: "Frequently Asked Questions (FAQ)",
		description: "Quick answers to common questions about the school year and platform.",
		icon: Info,
		buttonText: "Go to FAQ",
		onclick: () => alert("FAQ page coming soon!"),
	},
	{
		title: "Platform Settings & Help",
		description: "Manage your profile, notifications, and app preferences.",
		icon: Settings,
		buttonText: "Manage Settings",
		onclick: () => navigate("/home/settings/"),
	},
];

export const notifications = [
	// {
	// 	id: 1,
	// 	message: "Your mentor Mikey Lam sent you a new message.",
	// 	time: "2m ago",
	// 	type: "message",
	// },
	// {
	// 	id: 2,
	// 	message: "Robotics Club meeting moved to Tech Lab (Room 6).",
	// 	time: "1h ago",
	// 	type: "club",
	// },
	// {
	// 	id: 3,
	// 	message: "New resource: 'First-Day Checklist' available.",
	// 	time: "5h ago",
	// 	type: "resource",
	// },
	// {
	// 	id: 4,
	// 	message: "Mr. Barrios (Teacher) accepted your chat request.",
	// 	time: "1d ago",
	// 	type: "message",
	// },
	// {
	// 	id: 5,
	// 	message: "Your 1st period Math class is in Room 1.",
	// 	time: "2d ago",
	// 	type: "schedule",
	// },
	// { id: 6, message: "Club Rush sign-up starts tomorrow at lunch!", time: "3d ago", type: "club" },
];
