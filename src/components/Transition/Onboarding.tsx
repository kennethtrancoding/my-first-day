import * as React from "react";
import {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SignUp from "@/features/shared/pages/Landing/SignUp";
import { buildingCoords } from "@/features/shared/pages/map/buildingCoords";
import { interestOptions } from "@/constants";
import { useNavigate } from "react-router-dom";
import { Pin } from "lucide-react";
import { useStoredState } from "@/hooks/useStoredState";
import {
	getPendingEmail,
	getCurrentEmail,
	setCurrentEmail,
	clearPendingEmail,
	updateAccount,
} from "@/utils/auth";
const SCHOOL_NAME = "Hollencrest Middle School";

function Onboarding() {
	const navigate = useNavigate();

	const emailContext = React.useMemo(() => {
		const pending = getPendingEmail();
		if (pending) return pending;
		const current = getCurrentEmail();
		return current || "guest";
	}, []);
	const storagePrefix = React.useMemo(() => `user:${emailContext}:onboarding`, [emailContext]);

	const [currentStep, setCurrentStep] = useStoredState<number>(`${storagePrefix}:step`, 2);

	const lastNameRef = React.useRef<HTMLInputElement>(null);
	const gradeRef = React.useRef<HTMLInputElement>(null);
	const interestButtonRefs = React.useRef<HTMLButtonElement[]>([]);
	const scheduleInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

	const [firstName, setFirstName] = useStoredState<string>(`${storagePrefix}:firstName`, "");
	const [lastName, setLastName] = useStoredState<string>(`${storagePrefix}:lastName`, "");
	const [role, setRole] = useStoredState<"Student" | "Mentor" | "">(`${storagePrefix}:role`, "");

	const [schedule, setSchedule] = useStoredState<string[]>(
		`${storagePrefix}:schedule`,
		() => Array(7).fill("")
	);
	const [activePeriod, setActivePeriod] = React.useState<number | null>(null);
	const [roomSearch, setRoomSearch] = useStoredState<string[]>(
		`${storagePrefix}:roomSearch`,
		() => Array(7).fill("")
	);

	const [grade, setGrade] = useStoredState<string>(`${storagePrefix}:grade`, "");
	const [interests, setInterests] = useStoredState<string>(`${storagePrefix}:interests`, "");

	const [selectedInterests, setSelectedInterests] = useStoredState<string[]>(
		`${storagePrefix}:selectedInterests`,
		() => []
	);
	const [errorMessage, setErrorMessage] = React.useState<string>("");
	React.useEffect(() => {
		setErrorMessage("");
	}, [currentStep]);

	const roomEntries = React.useMemo(() => buildingCoords, []);
	const gradeNumber = React.useMemo(() => {
		const parsed = Number.parseInt(grade, 10);
		return Number.isNaN(parsed) ? null : parsed;
	}, [grade]);
	const isScheduleComplete = React.useMemo(
		() => schedule.slice(1, -1).every((room) => room.trim().length > 0),
		[schedule]
	);

	React.useEffect(() => {
		setInterests(selectedInterests.join(", "));
	}, [selectedInterests]);

	function handleCompleteOnboarding(nextRole?: "Student" | "Mentor") {
		const resolvedRole = nextRole ?? (role === "Mentor" ? "Mentor" : "Student");
		const normalizedRole = resolvedRole === "Mentor" ? "mentor" : "student";

		if (emailContext !== "guest") {
			updateAccount(emailContext, {
				role: normalizedRole,
				profile: {
					firstName,
					lastName,
					grade,
					interests: selectedInterests,
					schedule,
				},
			});
			setCurrentEmail(emailContext);
			clearPendingEmail();
		}

		setRole(resolvedRole);

		if (normalizedRole === "mentor") {
			navigate("/mentor/registration/");
		} else {
			navigate("/student/home/");
		}
	}

	function selectRole(selectedRole: "Student" | "Mentor") {
		setRole(selectedRole);
		if (selectedRole === "Student") {
			if (emailContext !== "guest") {
				updateAccount(emailContext, {
					role: "student",
					profile: {
						firstName,
						lastName,
					},
				});
			}
			setCurrentStep(4);
		} else {
			handleCompleteOnboarding("Mentor");
		}
	}

	function handleStudentInfoSubmit() {
		if (grade.trim() && interests.trim()) {
			if (emailContext !== "guest") {
				updateAccount(emailContext, {
					profile: {
						firstName,
						lastName,
						grade,
						interests: selectedInterests,
					},
				});
			}
			setCurrentStep(5);
			setErrorMessage("");
			return;
		}

		if (!grade.trim()) {
			gradeRef.current?.focus();
		} else if (selectedInterests.length === 0) {
			const firstInterest = interestButtonRefs.current.find(Boolean);
			firstInterest?.focus();
		}

		setErrorMessage("Please fill in your grade and interests to continue.");
	}

	function handleNameContinue() {
		if (firstName.trim() && lastName.trim()) {
			if (emailContext !== "guest") {
				updateAccount(emailContext, {
					profile: {
						firstName,
						lastName,
					},
				});
			}
			setCurrentStep(3);
			setErrorMessage("");
		} else {
			setErrorMessage("Please enter your first and last name.");
		}
	}

	function handleScheduleContinue() {
		if (isScheduleComplete) {
			setErrorMessage("");
			handleCompleteOnboarding("Student");
		} else {
			setErrorMessage("Please enter your class schedule.");
		}
	}

	function toggleInterest(tag: string) {
		setSelectedInterests((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	}

	function handleScheduleChange(periodIndex: number, room: string) {
		setSchedule((prev) => {
			const updated = [...prev];
			updated[periodIndex] = room;
			return updated;
		});

		setRoomSearch((prev) => {
			const updated = [...prev];
			updated[periodIndex] = room;
			return updated;
		});
	}

	const renderCardContent = () => {
		const errorNotice =
			errorMessage && (
				<p className="text-sm text-center text-destructive">{errorMessage}</p>
			);

		switch (currentStep) {
			case 1:
				return <SignUp />;
			case 2: {
				return (
					<>
						<CardHeader>
							<CardTitle>Enter your name</CardTitle>
							<CardDescription>
								Enter your full name so others can find you.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="first-name">First name</Label>
								<Input
									id="first-name"
									type="text"
									placeholder="Alex"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									onKeyDown={(event) => {
										if (event.key !== "Enter") return;

										event.preventDefault();
										lastNameRef.current?.focus();
									}}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="last-name">Last name</Label>
								<Input
									id="last-name"
									type="text"
									placeholder="Rivera"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									ref={lastNameRef}
									onKeyDown={(event) => {
										if (event.key !== "Enter") return;

										event.preventDefault();
										handleNameContinue();
									}}
								/>
							</div>
						</CardContent>
						<CardFooter className="w-full flex flex-col gap-2">
							<Button onClick={handleNameContinue} className="w-full">
								Continue
							</Button>
							{errorNotice}
							<button
								className="text-sm text-muted-foreground hover:underline cursor-pointer"
								onClick={() => navigate("/verification/")}>
								&larr; Back
							</button>
						</CardFooter>
					</>
				);
			}
			case 3:
				return (
					<>
						<CardHeader className="text-center">
							<CardTitle>
								Tell us about yourself{firstName ? `, ${firstName}` : ""}!
							</CardTitle>
							<CardDescription>
								Select your role to personalize your experience.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							<Button
								variant="default"
								size="lg"
								onClick={() => selectRole("Student")}>
								I am a new student
							</Button>
							<Button
								variant="outline"
								size="lg"
								onClick={() => selectRole("Mentor")}>
								I am a peer member or staff personnel
							</Button>
						</CardContent>
						<CardFooter className="flex justify-center">
							<button
								className="text-sm text-muted-foreground hover:underline cursor-pointer"
								onClick={() => setCurrentStep(2)}>
								&larr; Back
							</button>
						</CardFooter>
					</>
				);
			case 4:
				return (
					<>
						<CardHeader className="text-center">
							<CardTitle>Help us match you!</CardTitle>
							<CardDescription>
								Share your interests and grade level to find the perfect peer
								mentor.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6">
							<div className="grid gap-2">
								<Label htmlFor="grade">Your grade level</Label>
								<Input
									id="grade"
									type="number"
									placeholder="e.g., 7"
									value={grade}
									onChange={(e) => setGrade(e.target.value)}
									min={6}
									max={8}
									ref={gradeRef}
									onKeyDown={(event) => {
										if (event.key !== "Enter") return;

										event.preventDefault();
										if (!grade.trim()) {
											gradeRef.current?.focus();
											return;
										}

										if (selectedInterests.length === 0) {
											const firstInterest =
												interestButtonRefs.current.find(Boolean);
											if (firstInterest) {
												firstInterest.focus();
												return;
											}
										}

										handleStudentInfoSubmit();
									}}
								/>
							</div>

							<div className="grid gap-2">
								<Label>Your interests</Label>

								<div className="flex flex-wrap gap-2">
									{interestOptions.map((tag, index) => {
										const isSelected = selectedInterests.includes(tag);
										return (
											<Button
												key={tag}
												type="button"
												variant={isSelected ? "default" : "secondary"}
												size="sm"
												onClick={() => toggleInterest(tag)}
												className={`rounded-3xl transition-colors ${
													isSelected
														? "bg-primary text-primary-foreground"
														: "bg-muted text-foreground"
												}`}
												ref={(node) => {
													if (node) {
														interestButtonRefs.current[index] = node;
													}
												}}
												aria-pressed={isSelected}>
												{tag}
											</Button>
										);
									})}
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex flex-col gap-2">
							<Button
								className="w-full"
								onClick={handleStudentInfoSubmit}
								disabled={!grade.trim() || !interests.trim()}>
								Continue
							</Button>
							{errorNotice}
							<button
								className="text-sm text-muted-foreground hover:underline cursor-pointer"
								onClick={() => setCurrentStep(3)}>
								&larr; Back
							</button>
						</CardFooter>
					</>
				);

			case 5:
				return (
					<>
						<CardHeader className="text-center">
							<CardTitle>Enter your class schedule</CardTitle>
							<CardDescription>
								Your class schedule will be used to show you where your classes are
								on our map.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6">
							<div className="grid gap-4">
								{Array.from({ length: 7 }, (_, periodIndex) => {
									const normalizedQuery =
										roomSearch[periodIndex]?.trim().toLowerCase() ?? "";

									const filteredRooms = roomEntries.filter((entry) => {
										if (!entry.scheduleSubject) return false;

										const gradesByPeriod = entry.gradeLevel;
										if (gradesByPeriod) {
											const gradesForThisPeriod = gradesByPeriod[periodIndex];

											if (
												!gradesForThisPeriod ||
												gradesForThisPeriod.length === 0
											) {
												return false;
											}

											if (
												gradeNumber != null &&
												!gradesForThisPeriod.includes(gradeNumber)
											) {
												return false;
											}
										}

										if (normalizedQuery === "") {
											return true;
										}

										const subjectMatch = entry.scheduleSubject
											.toLowerCase()
											.includes(normalizedQuery);
										const roomMatch = entry.room
											.toLowerCase()
											.includes(normalizedQuery);

										return subjectMatch || roomMatch;
									});

									const noResultsMessage =
										gradeNumber != null
											? "No rooms match your grade for this period."
											: normalizedQuery
											? "No rooms match your search."
											: "No rooms available for this period.";

									return (
										<div className="flex items-center" key={periodIndex}>
											<Label className="pr-4">Period {periodIndex}</Label>
											<div className="flex-1 relative">
												<Input
													type="text"
													value={roomSearch[periodIndex] ?? ""}
													onChange={(e) => {
														const value = e.target.value;
														setRoomSearch((prev) => {
															const updated = [...prev];
															updated[periodIndex] = value;
															return updated;
														});
														setSchedule((prev) => {
															const updated = [...prev];
															updated[periodIndex] = value;
															return updated;
														});
													}}
													onFocus={() => setActivePeriod(periodIndex)}
													onBlur={() =>
														setTimeout(() => {
															setActivePeriod((prev) =>
																prev === periodIndex ? null : prev
															);
														}, 120)
													}
													placeholder="Search for a room"
													autoComplete="off"
													className="flex-grow"
													ref={(node) => {
														scheduleInputRefs.current[periodIndex] =
															node;
													}}
													onKeyDown={(event) => {
														if (event.key !== "Enter") return;

														event.preventDefault();
														const nextIndex = periodIndex + 1;
														const nextInput =
															scheduleInputRefs.current[nextIndex];

														if (nextInput) {
															nextInput.focus();
															return;
														}

														if (isScheduleComplete) {
															handleScheduleContinue();
														}
													}}
												/>
												{activePeriod === periodIndex && (
													<div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-md border border-border bg-card shadow-xl">
														<ul className="max-h-48 overflow-y-auto py-1">
															{filteredRooms.map((entry) => {
																const uniqueGrades =
																	entry.gradeLevel
																		? Array.from(
																				new Set(
																					Object.values(
																						entry.gradeLevel
																					)
																						.flat()
																						.map(
																							(
																								gradeValue
																							) =>
																								Number(
																									gradeValue
																								)
																						)
																				)
																		  ).sort((a, b) => a - b)
																		: [];
																const subjectLabel =
																	entry.scheduleSubject ??
																	"General Studies";
																const gradeLabel =
																	uniqueGrades.length
																		? `Grades ${uniqueGrades.join(
																				", "
																		  )}`
																		: null;

																return (
																	<li
																		key={entry.room}
																		className="group px-3 py-2 text-sm transition-colors hover:bg-primary hover:text-accent-foreground cursor-pointer"
																		onMouseDown={(event) => {
																			event.preventDefault();
																			handleScheduleChange(
																				periodIndex,
																				entry.room
																			);
																			setActivePeriod(null);
																		}}>
																		<div className="font-medium">
																			{entry.room}
																		</div>
																		<div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
																			{subjectLabel}
																			{gradeLabel
																				? ` · ${gradeLabel}`
																				: ""}
																		</div>
																	</li>
																);
															})}
															{filteredRooms.length === 0 && (
																<li className="px-3 py-2 text-sm text-muted-foreground">
																	{noResultsMessage}
																</li>
															)}
														</ul>
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
						<CardFooter className="w-full flex flex-col gap-2">
							<Button
								disabled={!isScheduleComplete}
								onClick={handleScheduleContinue}
								className="w-full">
								Create Account
							</Button>
							{errorNotice}

							<div className="flex flex-grow gap-4">
								<button
									className="text-sm text-muted-foreground hover:underline cursor-pointer"
									onClick={() => setCurrentStep(4)}>
									&larr; Back
								</button>
								<button
									className="text-sm text-muted-foreground hover:underline cursor-pointer"
									onClick={() => (window.location.href = "/student/home/")}>
									Skip &rarr;
								</button>
							</div>
						</CardFooter>
					</>
				);
			default:
				return null;
		}
	};

	return (
		<div className="w-screen h-screen flex items-center justify-center backdrop-blur-[3px] bg-gradient-hero">
			<Card className="w-full max-w-sm">
				<div className="flex gap-3 justify-center items-center rounded-t-lg border-b border-border bg-muted/50 px-4 py-3 text-center text-sm font-semibold tracking-wide text-muted-foreground">
					<Pin size={16} /> {SCHOOL_NAME}
				</div>
				{renderCardContent()}
			</Card>
		</div>
	);
}

export default Onboarding;
