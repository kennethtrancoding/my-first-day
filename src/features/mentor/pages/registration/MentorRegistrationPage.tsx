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
import { getCurrentId, updateAccount, type AccountProfile } from "@/utils/auth";

type MentorRole = "teacher" | "student";

const MentorRegistrationPage = () => {
	const currentId = React.useMemo(() => getCurrentId() || 0, []);
	const storagePrefix = React.useMemo(() => `user:${currentId}:mentorRegistration`, [currentId]);

	const [role, setRole] = useStoredState<MentorRole>(`${storagePrefix}:role`, "student");
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const navigate = useNavigate();

	const [teacherName, setTeacherName] = useStoredState<string>(
		`${storagePrefix}:teacher:name`,
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
	const [studentGrade, setStudentGrade] = useStoredState<string>(
		`${storagePrefix}:student:grade`,
		""
	);
	const [studentExperience, setStudentExperience] = useStoredState<string>(
		`${storagePrefix}:student:experience`,
		""
	);
	const [studentWhy, setStudentWhy] = useStoredState<string>(`${storagePrefix}:student:why`, "");

	function isNonEmpty(v: unknown) {
		if (v == null) {
			return false;
		}
		if (typeof v === "string") {
			return v.trim() !== "";
		}
		return true;
	}

	function isFormValid() {
		if (role === "teacher") {
			return (
				isNonEmpty(teacherName) &&
				isNonEmpty(teacherRoom) &&
				isNonEmpty(teacherDepartment) &&
				isNonEmpty(teacherFocus)
			);
		}
		return (
			isNonEmpty(studentName) &&
			isNonEmpty(studentGrade) &&
			isNonEmpty(studentExperience) &&
			isNonEmpty(studentWhy)
		);
	}
	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);

		const normalizedFullName = (role === "teacher" ? teacherName : studentName).trim();
		const [first, ...rest] = normalizedFullName.split(/\s+/);

		const profileUpdates: AccountProfile = {
			mentorType: role,
		};

		if (normalizedFullName) {
			profileUpdates.displayName = normalizedFullName;
			if (first) profileUpdates.firstName = first;
			if (rest.length > 0) profileUpdates.lastName = rest.join(" ");
		}

		if (role === "teacher") {
			if (teacherDepartment || teacherRoom) {
				profileUpdates.bio =
					`Department: ${teacherDepartment || "—"}` +
					(teacherRoom ? `, Room: ${teacherRoom}` : "");
			}
			if (teacherFocus) {
				profileUpdates.mentorOfficeHours = teacherFocus;
			}
		} else {
			if (studentGrade) profileUpdates.grade = studentGrade;
			if (studentExperience || studentWhy) {
				profileUpdates.mentorBio = [
					studentExperience && `Experience: ${studentExperience}`,
					studentWhy && `Why: ${studentWhy}`,
				]
					.filter(Boolean)
					.join(" | ");
			}
		}

		if (currentId !== 0) {
			updateAccount(currentId, {
				role: "mentor",
				profile: profileUpdates,
			});
		}

		setTimeout(() => {
			setIsSubmitting(false);
			navigate(role === "teacher" ? "/teacher/home/" : "/mentor/home/");
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
							<TabsTrigger value="student">Student Mentor</TabsTrigger>
							<TabsTrigger value="teacher">Teacher Mentor</TabsTrigger>
						</TabsList>

						<form className="mt-6 space-y-6" onSubmit={handleSubmit}>
							<TabsContent value="teacher" className="space-y-6">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="teacher-name">Full Name</Label>
										<Input
											id="teacher-name"
											placeholder="Alex Johnson"
											required
											value={teacherName}
											onChange={(e) => setTeacherName(e.target.value)}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="teacher-room">Room Number</Label>
										<Input
											id="teacher-room"
											placeholder="12"
											value={teacherRoom}
											onChange={(e) => setTeacherRoom(e.target.value)}
										/>
									</div>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="teacher-department">Department</Label>
									<Input
										id="teacher-department"
										placeholder="Visual Arts"
										required
										value={teacherDepartment}
										onChange={(e) => setTeacherDepartment(e.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="teacher-focus">Mentorship Focus</Label>
									<Input
										id="teacher-focus"
										placeholder="Robotics, coding, first-year transitions"
										required
										value={teacherFocus}
										onChange={(e) => setTeacherFocus(e.target.value)}
									/>
								</div>
							</TabsContent>

							<TabsContent value="student" className="space-y-6">
								<div className="grid gap-4 md:grid-cols-2">
									{" "}
									<div className="grid gap-2">
										<Label htmlFor="student-name">Full Name</Label>
										<Input
											id="student-name"
											type="text"
											placeholder="Alex Johnson"
											required
											value={studentName}
											onChange={(e) => setStudentName(e.target.value)}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="student-grade">Grade</Label>
										<Input
											id="student-grade"
											placeholder="8"
											required
											value={studentGrade}
											onChange={(e) => setStudentGrade(e.target.value)}
										/>
									</div>
								</div>

								<div className="grid gap-2">
									<Label htmlFor="student-experience">Experience Areas</Label>
									<Input
										id="student-experience"
										placeholder="Clubs, electives, first week tips"
										required
										value={studentExperience}
										onChange={(e) => setStudentExperience(e.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="student-why">Why do you want to mentor?</Label>
									<textarea
										id="student-why"
										required
										className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px]"
										placeholder="Share how you want to support incoming students."
										value={studentWhy}
										onChange={(e) => setStudentWhy(e.target.value)}
									/>
								</div>
							</TabsContent>

							<CardFooter className="flex flex-col gap-3">
								<Button
									type="submit"
									disabled={isSubmitting || !isFormValid()}
									className="w-full">
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Submitting
										</>
									) : (
										"Submit Application"
									)}
								</Button>
							</CardFooter>
						</form>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};

export default MentorRegistrationPage;
