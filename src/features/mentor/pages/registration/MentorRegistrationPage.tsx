import * as React from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentEmail, updateAccount } from "@/utils/auth";

type MentorRole = "teacher" | "student";

const MentorRegistrationPage = () => {
	const currentEmail = React.useMemo(() => getCurrentEmail() || "guest-mentor", []);
	const storagePrefix = React.useMemo(
		() => `user:${currentEmail}:mentorRegistration`,
		[currentEmail]
	);
	const onboardingPrefix = React.useMemo(
		() =>
			`user:${
				currentEmail === "guest-mentor" || !currentEmail ? "guest" : currentEmail
			}:onboarding`,
		[currentEmail]
	);
	const [role, setRole] = useStoredState<MentorRole>(`${storagePrefix}:role`, "teacher");
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const navigate = useNavigate();

	const [onboardingFirstName] = useStoredState<string>(`${onboardingPrefix}:firstName`, "");
	const [onboardingLastName] = useStoredState<string>(`${onboardingPrefix}:lastName`, "");
	const onboardingFullName = React.useMemo(
		() =>
			[onboardingFirstName, onboardingLastName]
				.map((part) => part.trim())
				.filter(Boolean)
				.join(" "),
		[onboardingFirstName, onboardingLastName]
	);

	const [teacherName, setTeacherName] = useStoredState<string>(
		`${storagePrefix}:teacher:name`,
		""
	);
	const [teacherEmail, setTeacherEmail] = useStoredState<string>(
		`${storagePrefix}:teacher:email`,
		""
	);
	const [teacherDepartment, setTeacherDepartment] = useStoredState<string>(
		`${storagePrefix}:teacher:department`,
		""
	);
	const [teacherRoom, setTeacherRoom] = useStoredState<string>(
		`${storagePrefix}:teacher:room`,
		""
	);
	const [teacherFocus, setTeacherFocus] = useStoredState<string>(
		`${storagePrefix}:teacher:focus`,
		""
	);

	const [studentName, setStudentName] = useStoredState<string>(
		`${storagePrefix}:student:name`,
		""
	);
	const [studentEmail, setStudentEmail] = useStoredState<string>(
		`${storagePrefix}:student:email`,
		""
	);
	const [studentGrade, setStudentGrade] = useStoredState<string>(
		`${storagePrefix}:student:grade`,
		""
	);
	const [studentExperience, setStudentExperience] = useStoredState<string>(
		`${storagePrefix}:student:experience`,
		""
	);
	const [studentWhy, setStudentWhy] = useStoredState<string>(`${storagePrefix}:student:why`, "");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		if (currentEmail !== "guest-mentor") {
			updateAccount(currentEmail, { role: "mentor" });
		}
		setTimeout(() => {
			setIsSubmitting(false);
			navigate("/mentor/home/");
		}, 900);
	}

	return (
		<div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-12">
			<Card className="w-full max-w-3xl">
				<CardHeader className="space-y-3 text-center">
					<CardTitle className="text-2xl">Become a Mentor</CardTitle>
					<CardDescription className="text-base">
						Share your experience and help new students find their footing.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<Tabs value={role} onValueChange={(value) => setRole(value as MentorRole)}>
						<TabsList className="grid grid-cols-2 w-full">
							<TabsTrigger value="teacher">Teacher Mentor</TabsTrigger>
							<TabsTrigger value="student">Student Mentor</TabsTrigger>
						</TabsList>

						<form className="mt-6 space-y-6" onSubmit={handleSubmit}>
							<TabsContent value="teacher" className="space-y-6">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="teacher-name">Full Name</Label>
										<Input
											id="teacher-name"
											placeholder="Ms. Rivera"
											required
											value={onboardingFullName || teacherName}
											readOnly={Boolean(onboardingFullName)}
											onChange={
												onboardingFullName
													? undefined
													: (event) => setTeacherName(event.target.value)
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="teacher-email">School Email</Label>
										<Input
											id="teacher-email"
											type="email"
											placeholder="rivera@wcusd.org"
											required
											value={teacherEmail}
											onChange={(event) =>
												setTeacherEmail(event.target.value)
											}
										/>
									</div>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="teacher-department">Department</Label>
										<Input
											id="teacher-department"
											placeholder="Visual Arts"
											required
											value={teacherDepartment}
											onChange={(event) =>
												setTeacherDepartment(event.target.value)
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="teacher-room">Room Number</Label>
										<Input
											id="teacher-room"
											placeholder="Room 12"
											value={teacherRoom}
											onChange={(event) => setTeacherRoom(event.target.value)}
										/>
									</div>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="teacher-focus">Mentorship Focus</Label>
									<Input
										id="teacher-focus"
										placeholder="Robotics, coding, first-year transitions"
										required
										value={teacherFocus}
										onChange={(event) => setTeacherFocus(event.target.value)}
									/>
								</div>
							</TabsContent>

							<TabsContent value="student" className="space-y-6">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="student-name">Full Name</Label>
										<Input
											id="student-name"
											placeholder="Jordan Lee"
											required
											value={onboardingFullName || studentName}
											readOnly={Boolean(onboardingFullName)}
											onChange={
												onboardingFullName
													? undefined
													: (event) => setStudentName(event.target.value)
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="student-email">School Email</Label>
										<Input
											id="student-email"
											type="email"
											placeholder="leej@wcusd.net"
											required
											value={studentEmail}
											onChange={(event) =>
												setStudentEmail(event.target.value)
											}
										/>
									</div>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="student-grade">Grade</Label>
										<Input
											id="student-grade"
											placeholder="8"
											required
											value={studentGrade}
											onChange={(event) =>
												setStudentGrade(event.target.value)
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="student-experience">Experience Areas</Label>
										<Input
											id="student-experience"
											placeholder="Clubs, electives, first week tips"
											required
											value={studentExperience}
											onChange={(event) =>
												setStudentExperience(event.target.value)
											}
										/>
									</div>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="student-why">Why do you want to mentor?</Label>
									<textarea
										id="student-why"
										required
										className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px]"
										placeholder="Share how you want to support incoming students."
										value={studentWhy}
										onChange={(event) => setStudentWhy(event.target.value)}
									/>
								</div>
							</TabsContent>

							<CardFooter className="flex flex-col gap-3">
								<Button type="submit" disabled={isSubmitting} className="w-full">
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Submitting
										</>
									) : (
										"Submit Application"
									)}
								</Button>
								<p className="text-xs text-muted-foreground text-center">
									We'll review your application within one school day and send
									next steps to your email.
								</p>
							</CardFooter>
						</form>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};

export default MentorRegistrationPage;
