import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { buildingCoords } from "@/features/shared/pages/map/buildingCoords";

import { Badge } from "@/components/ui/badge";
import {
	Loader2,
	Lock,
	Bell,
	User,
	LogOut,
	BookOpen,
	CalendarDays,
	Shirt,
	ArrowRight,
	Users,
	Mail,
} from "lucide-react";
import * as React from "react";
import StudentDashboardLayout from "@/features/student/components/StudentDashboardLayout";
import { interestOptions } from "@/utils/data";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import {
	getCurrentId,
	updateAccount,
	logout,
	findAccount,
	updateAccountEmail,
	findAccountUsingEmail,
} from "@/utils/auth";
import { matchMentorsForStudent } from "@/utils/mentorMatching";
import { writeToStorage } from "@/utils/storage";
import { pushNotificationForRole } from "@/hooks/useNotifications";

type SaveState = "idle" | "saving" | "saved";
type FieldKey =
	| "name"
	| "interests"
	| "clothingSize"
	| "bio"
	| "schedule"
	| "notifications"
	| "email";

interface FieldStatusMap {
	[field: string]: SaveState;
}

function SaveButton({
	state,
	onClick,
	idleText,
}: {
	state: SaveState;
	onClick: () => void;
	idleText: string;
}) {
	return (
		<Button
			onClick={onClick}
			disabled={state === "saving"}
			className="inline-flex items-center">
			{state === "saving" && (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
				</>
			)}
			{state === "saved" && <>Saved!</>}
			{state === "idle" && (
				<>
					{idleText}
					<ArrowRight size={16} className="ml-2" />
				</>
			)}
		</Button>
	);
}

function StudentSettingsPage() {
	const [currentId, setCurrentId] = React.useState(() => getCurrentId());
	const currentEmail = findAccount(currentId)?.email ?? "";
	const storageIdentity = currentId || 0;
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:studentSettings`,
		[storageIdentity]
	);

	const account = React.useMemo(() => (currentId ? findAccount(currentId) : null), [currentId]);

	const fallbackName = React.useMemo(() => {
		if (!currentId) {
			return "Student";
		}

		if (account) {
			const profile = account.profile ?? {};
			const displayNameFromProfile = profile.displayName?.trim();
			if (displayNameFromProfile) {
				return displayNameFromProfile;
			}

			const composedName = [profile.firstName, profile.lastName]
				.filter((part): part is string => Boolean(part && part.trim()))
				.map((part) => part.trim())
				.join(" ");

			if (composedName) {
				return composedName;
			}
		}

		const localPart = currentEmail.split("@")[0] ?? "";
		const cleaned = localPart.replace(/[._-]+/g, " ").trim();
		if (cleaned) {
			return cleaned
				.split(" ")
				.filter(Boolean)
				.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
				.join(" ");
		}

		return "Student";
	}, [account, currentEmail]);

	const navigate = useNavigate();

	React.useEffect(() => {
		if (!currentEmail || !account || account.role !== "student") {
			navigate("/", { replace: true });
		}
	}, [account, currentEmail, navigate]);

	const [username, setUsername] = useStoredState<string>(
		`${storagePrefix}:name`,
		() => fallbackName
	);
	const email = currentEmail ?? "";
	const [emailInput, setEmailInput] = React.useState(email);
	const [emailError, setEmailError] = React.useState<string | null>(null);

	React.useEffect(() => {
		setEmailInput(currentEmail ?? "");
	}, [currentEmail]);

	const [selectedInterests, setSelectedInterests] = useStoredState<string>(
		`${storagePrefix}:interests`,
		() => (account?.profile?.interests ?? []).join(", ")
	);
	const [clothingSize, setClothingSize] = useStoredState<string>(
		`${storagePrefix}:clothingSize`,
		() => account?.profile?.clothingSize ?? "M"
	);
	const [bio, setBio] = useStoredState<string>(
		`${storagePrefix}:bio`,
		() => account?.profile?.bio ?? ""
	);
	const [schedule, setSchedule] = useStoredState<string[]>(`${storagePrefix}:schedule`, () => {
		const baseSchedule = Array.isArray(account?.profile?.schedule)
			? [...(account?.profile?.schedule ?? [])]
			: [];
		while (baseSchedule.length < 7) {
			baseSchedule.push("");
		}
		return baseSchedule.slice(0, 7);
	});
	const scheduleInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
	const [activePeriod, setActivePeriod] = React.useState<number | null>(null);
	const [roomSearch, setRoomSearch] = React.useState<string[]>(() => [...schedule]);

	const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useStoredState<boolean>(
		`${storagePrefix}:emailNotificationsEnabled`,
		() => {
			if (account?.settings?.emailNotificationsEnabled != null) {
				return account.settings.emailNotificationsEnabled;
			}
			return true;
		}
	);
	const [pushNotificationsEnabled, setPushNotificationsEnabled] = useStoredState<boolean>(
		`${storagePrefix}:pushNotificationsEnabled`,
		() => {
			if (account?.settings?.pushNotificationsEnabled != null) {
				return account.settings.pushNotificationsEnabled;
			}
			return true;
		}
	);

	const roomEntries = buildingCoords;
	const gradeNumber = React.useMemo(() => {
		const gradeValue = account?.profile?.grade ?? "";
		const parsed = Number.parseInt(gradeValue, 10);
		return Number.isNaN(parsed) ? null : parsed;
	}, [account]);

	const [fieldStatus, setFieldStatus] = React.useState<FieldStatusMap>({
		name: "idle",
		interests: "idle",
		clothingSize: "idle",
		bio: "idle",
		schedule: "idle",
		notifications: "idle",
		email: "idle",
	});

	function setSaveStatus(field: FieldKey, status: SaveState) {
		setFieldStatus((prev) => ({ ...prev, [field]: status }));
	}

	function simulateSave(field: FieldKey) {
		setSaveStatus(field, "saving");
		setTimeout(() => {
			setSaveStatus(field, "saved");
			setTimeout(() => setSaveStatus(field, "idle"), 1500);
		}, 900);
	}

	const parsedInterests = React.useMemo(
		() =>
			selectedInterests
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean),
		[selectedInterests]
	);
	React.useEffect(() => {
		setRoomSearch((prev) => {
			if (
				prev.length !== schedule.length ||
				prev.some((value, index) => value !== schedule[index])
			) {
				return [...schedule];
			}
			return prev;
		});
	}, [schedule]);

	function handleScheduleChange(periodIndex: number, room: string) {
		setSchedule((prev) => {
			const next = [...prev];
			next[periodIndex] = room;
			return next;
		});
		setRoomSearch((prev) => {
			const next = [...prev];
			next[periodIndex] = room;
			return next;
		});
	}

	function handleSavePreferences(field: FieldKey) {
		if (field === "name") {
			const trimmedName = username.trim();
			const nextName = trimmedName || fallbackName;
			if (trimmedName !== username || !trimmedName) {
				setUsername(nextName);
			}

			if (currentEmail) {
				updateAccount(currentId, {
					profile: {
						displayName: nextName,
					},
				});
			}

			simulateSave(field);
			return;
		}

		if (currentEmail) {
			switch (field) {
				case "interests":
					updateAccount(currentId, {
						profile: {
							interests: parsedInterests,
						},
					});
					break;
				case "clothingSize":
					updateAccount(currentId, {
						profile: {
							clothingSize,
						},
					});
					break;
				case "bio":
					updateAccount(currentId, {
						profile: {
							bio,
						},
					});
					break;
				case "schedule": {
					const normalizedSchedule = schedule.map((entry) => entry.trim());
					while (normalizedSchedule.length < 7) {
						normalizedSchedule.push("");
					}
					const trimmedSchedule = normalizedSchedule.slice(0, 7);
					updateAccount(currentId, {
						profile: {
							schedule: trimmedSchedule,
						},
					});
					setSchedule(trimmedSchedule);
					setRoomSearch(trimmedSchedule);
					break;
				}
				case "notifications":
					updateAccount(currentId, {
						settings: {
							emailNotificationsEnabled,
							pushNotificationsEnabled: pushNotificationsEnabled,
						},
					});
					break;
			}
		}
		simulateSave(field);
	}

	function handleEmailUpdate() {
		const trimmed = emailInput.trim().toLowerCase();
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!currentEmail) {
			setEmailError("You must be signed in to change your email.");
			return;
		}

		if (!trimmed || !emailPattern.test(trimmed)) {
			setEmailError("Enter a valid email address.");
			return;
		}

		if (trimmed === currentEmail.toLowerCase()) {
			setEmailError("You're already using this email.");
			return;
		}

		setEmailError(null);
		setSaveStatus("email", "saving");
		const result = updateAccountEmail(currentId, trimmed);

		if (!result.success || !result.email) {
			setEmailError(result.error ?? "That email is already in use.");
			setSaveStatus("email", "idle");
			return;
		}

		setCurrentId(findAccountUsingEmail(result.email).id);
		setEmailInput(result.email);
		setSaveStatus("email", "saved");
		setTimeout(() => setSaveStatus("email", "idle"), 1500);
	}

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	const handlePasswordReset = () => {
		const initialEmailState = currentEmail ?? "";
		navigate("/reset-password/", { state: { email: initialEmailState } });
	};

	const handleSwitchToMentor = () => {
		if (currentEmail) {
			updateAccount(currentId, { role: "mentor" });
		}
		navigate("/mentor/registration/");
	};

	const handleChangeSchools = () => {
		logout();
		navigate("/verification/");
	};

	return (
		<StudentDashboardLayout activePage="settings">
			<div className="container mx-auto px-4 space-y-6">
				<Tabs defaultValue="profile" className="w-full">
					<div className="sticky top-0 z-10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 py-2">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="profile" className="flex items-center gap-2">
								<User className="h-4 w-4" /> Profile
							</TabsTrigger>
							<TabsTrigger value="preferences" className="flex items-center gap-2">
								<BookOpen className="h-4 w-4" /> Preferences
							</TabsTrigger>
							<TabsTrigger value="security" className="flex items-center gap-2">
								<Lock className="h-4 w-4" /> Security
							</TabsTrigger>
							<TabsTrigger value="notifications" className="flex items-center gap-2">
								<Bell className="h-4 w-4" /> Notifications
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="profile" className="space-y-6">
						<TabsContent value="profile" className="space-y-6">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<User className="h-4 w-4 text-primary" />
											Profile Information
										</CardTitle>
										<CardDescription>
											Manage basic account information.
										</CardDescription>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="display-name">Display name</Label>
										<Input
											id="display-name"
											value={username}
											onChange={(event) => setUsername(event.target.value)}
											placeholder="Alex Johnson"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="teacher-bio">Bio</Label>
										<textarea
											id="bio"
											value={bio}
											onChange={(e) => setBio(e.target.value)}
											className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
											placeholder="Share your interests, favorite projects, or what you're doing next summer."
										/>
										<p className="text-xs text-muted-foreground">
											This appears on resource pages and helps students know
											your focus areas.
										</p>
									</div>
									<div className="flex gap-2">
										<SaveButton
											state={fieldStatus.name}
											onClick={() => handleSavePreferences("name")}
											idleText="Save Profile"
										/>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5 text-secondary" />
									Your Role
								</CardTitle>
								<CardDescription>
									Change your role to become a Peer Mentor and start helping new
									students.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm">
									Current Role: <span className="font-semibold">Student</span>
								</p>
								<div className="flex flex-wrap gap-2">
									<Button variant="secondary" onClick={handleSwitchToMentor}>
										Switch to Mentor Account
										<ArrowRight size={16} className="ml-2" />
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="preferences" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CalendarDays className="h-5 w-5 text-primary" />
									Class Schedule
								</CardTitle>
								<CardDescription>
									Add the rooms or course names for each period so mentors can
									help you find them faster.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4">
									{schedule.map((_, index) => {
										const normalizedQuery =
											roomSearch[index]?.trim().toLowerCase() ?? "";

										const filteredRooms = roomEntries.filter((entry) => {
											if (!entry.scheduleSubject) return false;

											const gradesByPeriod = entry.gradeLevel;
											if (gradesByPeriod) {
												const gradesForThisPeriod = gradesByPeriod[index];

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
											<div className="flex items-center gap-4" key={index}>
												<Label className="w-20 text-right font-medium text-sm">
													Period {index}
												</Label>
												<div className="relative flex-1">
													<Input
														id={`schedule-period-${index}`}
														type="text"
														value={roomSearch[index] ?? ""}
														onChange={(event) => {
															const value = event.target.value;
															setRoomSearch((prev) => {
																const next = [...prev];
																next[index] = value;
																return next;
															});
															setSchedule((prev) => {
																const next = [...prev];
																next[index] = value;
																return next;
															});
														}}
														onFocus={() => setActivePeriod(index)}
														onBlur={() =>
															setTimeout(() => {
																setActivePeriod((prev) =>
																	prev === index ? null : prev
																);
															}, 120)
														}
														placeholder="Search for a room"
														autoComplete="off"
														className="flex-grow"
														ref={(node) => {
															scheduleInputRefs.current[index] = node;
														}}
														onKeyDown={(event) => {
															if (event.key !== "Enter") return;

															event.preventDefault();
															const nextIndex = index + 1;
															const nextInput =
																scheduleInputRefs.current[
																	nextIndex
																];

															if (nextInput) {
																nextInput.focus();
															}
														}}
													/>
													{activePeriod === index && (
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
																			  ).sort(
																					(a, b) => a - b
																			  )
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
																			onMouseDown={(
																				event
																			) => {
																				event.preventDefault();
																				handleScheduleChange(
																					index,
																					entry.room
																				);
																				setActivePeriod(
																					null
																				);
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
								<SaveButton
									state={fieldStatus.schedule}
									onClick={() => handleSavePreferences("schedule")}
									idleText="Save Schedule"
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="h-5 w-5 text-primary" />
									My Interests
								</CardTitle>
								<CardDescription>
									Select the topics and activities that interest you to get better
									mentor/club matches.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-wrap gap-2">
									{interestOptions.map((tag) => {
										const isSelected = parsedInterests.includes(tag);

										return (
											<Button
												key={tag}
												type="button"
												variant={isSelected ? "default" : "secondary"}
												size="sm"
												onClick={() =>
													setSelectedInterests(() => {
														const next = isSelected
															? parsedInterests.filter(
																	(t) => t !== tag
															  )
															: [...parsedInterests, tag];

														writeToStorage(
															`user:${storageIdentity}:profile:matchedMentorIds`,
															matchMentorsForStudent(
																{
																	grade: gradeNumber ?? undefined,
																	interests: next,
																},
																{ limit: 1 }
															)
														);

														return next.join(", ");
													})
												}
												className={`rounded-3xl transition-colors ${
													isSelected
														? "bg-primary text-primary-foreground hover:bg-primary-light"
														: "bg-muted text-foreground hover:bg-muted-foreground/80"
												}`}>
												{tag}
											</Button>
										);
									})}
								</div>

								<SaveButton
									state={fieldStatus.interests}
									onClick={() => handleSavePreferences("interests")}
									idleText="Save Interests"
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shirt className="h-5 w-5 text-secondary" />
									Clothing Size
								</CardTitle>
								<CardDescription>
									This is often needed for school-issued gear or club merchandise.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid w-full max-w-sm items-center gap-1.5">
									<Label htmlFor="clothing-size">T-Shirt Size</Label>
									<Input
										id="clothing-size"
										placeholder="M"
										value={clothingSize}
										onChange={(e) =>
											setClothingSize(e.target.value.toUpperCase())
										}
									/>
								</div>
								<SaveButton
									state={fieldStatus.clothingSize}
									onClick={() => handleSavePreferences("clothingSize")}
									idleText="Save Size"
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="security" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Mail className="h-5 w-5 text-primary" />
									Update Email
								</CardTitle>
								<CardDescription>
									Use the email you check most so you never miss a mentor message.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Current email</Label>
									<Input value={currentEmail ?? ""} readOnly disabled />
								</div>
								<div className="space-y-2">
									<Label htmlFor="student-new-email">New email</Label>
									<Input
										id="student-new-email"
										type="email"
										value={emailInput}
										onChange={(event) => setEmailInput(event.target.value)}
										placeholder="you@example.com"
									/>
								</div>
								{emailError && (
									<p className="text-sm text-destructive">{emailError}</p>
								)}
								<SaveButton
									state={fieldStatus.email}
									onClick={handleEmailUpdate}
									idleText="Update Email"
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Lock className="h-5 w-5 text-destructive" />
									Security
								</CardTitle>
								<CardDescription>
									Update your password and manage sessions.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-wrap gap-3">
									<Button
										variant="destructive"
										className="w-full sm:w-auto"
										onClick={handlePasswordReset}>
										Change Password
									</Button>
									<Button
										variant="outline"
										className="w-full sm:w-auto"
										onClick={() => alert("All other sessions logged out!")}>
										Log Out from Other Devices
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Bell className="h-5 w-5 text-secondary" />
									Notifications
								</CardTitle>
								<CardDescription>
									Configure how you receive updates.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-start justify-between gap-4 rounded-xl border p-4">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<Label
												htmlFor="email-notifs"
												className="text-base font-medium">
												Email Notifications
											</Label>
										</div>
										<p className="text-sm text-muted-foreground">
											Receive emails for new messages, tasks, and event
											reminders.
										</p>
									</div>
									<div className="flex items-center gap-3">
										<Switch
											id="email-notifs"
											checked={emailNotificationsEnabled}
											onCheckedChange={setEmailNotificationsEnabled}
										/>
									</div>
								</div>

								<div className="flex items-start justify-between gap-4 rounded-xl border p-4">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<Label
												htmlFor="push-notifs"
												className="text-base font-medium">
												Push Notifications
											</Label>
										</div>
										<p className="text-sm text-muted-foreground">
											Native push alerts for mentions and direct messages.
										</p>
									</div>
									<div className="flex items-center gap-3">
										<Switch
											id="push-notifs"
											checked={pushNotificationsEnabled}
											onCheckedChange={setPushNotificationsEnabled}
										/>
									</div>
								</div>

								<div>
									<SaveButton
										state={fieldStatus.notifications}
										onClick={() => handleSavePreferences("notifications")}
										idleText="Save Notification Settings"
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<div className="pt-2">
					<div className="flex flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							className="w-full sm:w-auto hover:bg-blue-50 hover:text-blue-600"
							onClick={handleChangeSchools}>
							Change Schools
						</Button>
						<Button
							variant="outline"
							className="w-full sm:w-auto hover:bg-red-50 hover:text-red-600"
							onClick={handleLogout}>
							<LogOut className="h-4 w-4 mr-2" /> Log Out
						</Button>
					</div>
				</div>
			</div>
		</StudentDashboardLayout>
	);
}

export default StudentSettingsPage;
