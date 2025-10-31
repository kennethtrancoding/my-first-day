import * as React from "react";
import {
	User,
	Clock,
	Mail,
	Bell,
	ShieldCheck,
	LogOut,
	CheckCircle2,
	Loader2,
	Settings2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoredState } from "@/hooks/useStoredState";
import TeacherDashboardLayout from "@/features/teacher/components/TeacherDashboardLayout";
import {
	findAccounts,
	getCurrentId,
	logout,
	updateAccount,
	updateAccountEmail,
} from "@/utils/auth";
import { useNavigate } from "react-router-dom";

const textareaClassName =
	"flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";

const DIGEST_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type SaveState = "idle" | "saving" | "saved";
type FieldKey = "profile" | "availability" | "alerts" | "digest-day" | "email";

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
			className="inline-flex items-center gap-2 min-w-[140px] justify-center">
			{state === "saving" && (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					Saving…
				</>
			)}
			{state === "saved" && (
				<>
					<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					Saved
				</>
			)}
			{state === "idle" && idleText}
		</Button>
	);
}

function TeacherSettingsPage() {
	const navigate = useNavigate();

	const [currentId] = React.useState<number | null>(() => getCurrentId() ?? null);
	const storageIdentity = currentId ?? "anonymous-teacher";
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:teacherSettings`,
		[storageIdentity]
	);

	const account = React.useMemo(
		() => (currentId ? findAccounts({ ids: [currentId] })[0] : null),
		[currentId]
	);

	const fallbackName = React.useMemo(() => {
		if (!account) return "Teacher";
		const profile = account.profile ?? {};
		const displayNameFromProfile = profile.displayName?.trim();
		if (displayNameFromProfile) return displayNameFromProfile;

		const composedName = [profile.firstName, profile.lastName]
			.filter((part): part is string => Boolean(part && part.trim()))
			.map((part) => part.trim())
			.join(" ");
		return composedName || "Teacher";
	}, [account]);

	const [displayName, setDisplayName] = useStoredState<string>(
		`${storagePrefix}:displayName`,
		() => fallbackName
	);
	const [teacherTitle, setTeacherTitle] = useStoredState<string>(
		`${storagePrefix}:title`,
		() => account?.profile?.teacherTitle ?? "Electives & Clubs Lead"
	);
	const [roomLocation, setRoomLocation] = useStoredState<string>(
		`${storagePrefix}:room`,
		() => account?.profile?.teacherRoom ?? "Room 220"
	);
	const [bio, setBio] = useStoredState<string>(
		`${storagePrefix}:bio`,
		() =>
			account?.profile?.bio ??
			"Career pathways lead helping students explore electives and clubs."
	);
	const [officeHours, setOfficeHours] = useStoredState<string>(
		`${storagePrefix}:officeHours`,
		() => account?.profile?.mentorOfficeHours ?? "Mon–Thu · 3:15 – 4:15 PM"
	);
	const [availabilityNotes, setAvailabilityNotes] = useStoredState<string>(
		`${storagePrefix}:availabilityNotes`,
		() =>
			account?.profile?.teacherAvailabilityNotes ??
			"Drop by after school or send a message for quick approvals."
	);
	const [acceptingRequests, setAcceptingRequests] = useStoredState<boolean>(
		`${storagePrefix}:acceptingRequests`,
		() => account?.settings?.availability ?? true
	);
	const [emailAnnouncements, setEmailAnnouncements] = useStoredState<boolean>(
		`${storagePrefix}:emailAnnouncements`,
		() => account?.settings?.emailNotificationsEnabled ?? true
	);
	const [weeklyDigestDay, setWeeklyDigestDay] = useStoredState<string>(
		`${storagePrefix}:digestDay`,
		() => account?.settings?.digestWeekday ?? "Friday"
	);
	const [weeklyDigestTime, setWeeklyDigestTime] = useStoredState<string>(
		`${storagePrefix}:digestTime`,
		() => account?.settings?.digestTime ?? "15:30"
	);
	const [resourceReminders, setResourceReminders] = useStoredState<boolean>(
		`${storagePrefix}:resourceReminders`,
		() => account?.settings?.resourceRemindersEnabled ?? true
	);
	const [mapAlerts, setMapAlerts] = useStoredState<boolean>(
		`${storagePrefix}:mapAlerts`,
		() => account?.settings?.mapAlertsEnabled ?? true
	);
	const [urgentSms, setUrgentSms] = useStoredState<boolean>(
		`${storagePrefix}:urgentSms`,
		() => account?.settings?.smsUrgentAlertsEnabled ?? false
	);
	const [alertNotes, setAlertNotes] = useStoredState<string>(
		`${storagePrefix}:alertNotes`,
		() => ""
	);

	const [emailInput, setEmailInput] = React.useState<string>(account?.email ?? "");
	const [emailError, setEmailError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!displayName.trim()) setDisplayName(fallbackName);
	}, [displayName, fallbackName, setDisplayName]);

	React.useEffect(() => {
		setEmailInput(account?.email ?? "");
	}, [account?.email]);

	const [fieldStatus, setFieldStatus] = React.useState<Record<FieldKey, SaveState>>({
		profile: "idle",
		availability: "idle",
		"digest-day": "idle",
		alerts: "idle",
		email: "idle",
	});

	function simulateSave(field: FieldKey, action?: () => void) {
		setFieldStatus((prev) => ({ ...prev, [field]: "saving" }));
		action?.();
		setTimeout(() => {
			setFieldStatus((prev) => ({ ...prev, [field]: "saved" }));
			setTimeout(() => setFieldStatus((prev) => ({ ...prev, [field]: "idle" })), 1400);
		}, 900);
	}

	function handleProfileSave() {
		simulateSave("profile", () => {
			const normalizedName = displayName.trim() || fallbackName;
			if (normalizedName !== displayName) setDisplayName(normalizedName);

			if (currentId) {
				updateAccount(currentId, {
					profile: {
						displayName: normalizedName,
						teacherTitle,
						teacherRoom: roomLocation,
						bio,
					},
				});
			}
		});
	}

	function handleAvailabilitySave() {
		simulateSave("availability", () => {
			if (currentId) {
				updateAccount(currentId, {
					profile: {
						mentorOfficeHours: officeHours,
						teacherAvailabilityNotes: availabilityNotes,
					},
					settings: {
						availability: acceptingRequests,
					},
				});
			}
		});
	}

	function handleDigestSave() {
		simulateSave("digest-day", () => {
			if (currentId) {
				updateAccount(currentId, {
					settings: {
						digestWeekday: weeklyDigestDay,
						digestTime: weeklyDigestTime,
					},
				});
			}
		});
	}

	function handleEmailUpdate() {
		if (!currentId) {
			setEmailError("You must be signed in to change your email.");
			return;
		}

		const trimmed = emailInput.trim().toLowerCase();
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!trimmed || !emailPattern.test(trimmed)) {
			setEmailError("Enter a valid email address.");
			return;
		}

		const currentEmail = account?.email?.toLowerCase() ?? "";
		if (trimmed === currentEmail) {
			setEmailError("You're already using this email.");
			return;
		}

		setEmailError(null);
		setFieldStatus((prev) => ({ ...prev, email: "saving" }));

		const result = updateAccountEmail(currentId, trimmed);
		if (!result.success || !result.email) {
			setEmailError(result.error ?? "That email is already in use.");
			setFieldStatus((prev) => ({ ...prev, email: "idle" }));
			return;
		}

		setEmailInput(result.email);
		setFieldStatus((prev) => ({ ...prev, email: "saved" }));
		setTimeout(() => setFieldStatus((prev) => ({ ...prev, email: "idle" })), 1400);
	}

	function handleAlertSave() {
		simulateSave("alerts", () => {
			if (currentId) {
				updateAccount(currentId, {
					settings: {
						mapAlertsEnabled: mapAlerts,
						smsUrgentAlertsEnabled: urgentSms,

						resourceRemindersEnabled: resourceReminders,
						emailNotificationsEnabled: emailAnnouncements,
					},
				});
			}
		});
	}

	function handlePasswordReset() {
		if (!currentId) return;

		navigate("/reset-password/", { state: { id: currentId } });
	}

	function handleLogout() {
		logout();
		navigate("/");
	}

	return (
		<TeacherDashboardLayout activePage="settings">
			<div className="space-y-6">
				<div className="space-y-1">
					<p className="text-muted-foreground max-w-3xl">
						Share how students can reach you, fine-tune notifications, and manage your
						account.
					</p>
				</div>

				<Tabs defaultValue="profile" className="space-y-6">
					<TabsList className="grid w-full gap-2 md:grid-cols-4">
						<TabsTrigger value="profile" className="flex items-center gap-2">
							<User className="h-4 w-4" />
							Profile
						</TabsTrigger>
						<TabsTrigger value="preferences" className="flex items-center gap-2">
							<Settings2 className="h-4 w-4" />
							Preferences
						</TabsTrigger>
						<TabsTrigger value="notifications" className="flex items-center gap-2">
							<Bell className="h-4 w-4" />
							Notifications
						</TabsTrigger>
						<TabsTrigger value="security" className="flex items-center gap-2">
							<ShieldCheck className="h-4 w-4" />
							Security
						</TabsTrigger>
					</TabsList>

					<TabsContent value="profile" className="space-y-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<User className="h-4 w-4 text-primary" />
										Profile details
									</CardTitle>
									<CardDescription>
										Update the basics teammates and students see first.
									</CardDescription>
								</div>
								<SaveButton
									state={fieldStatus.profile}
									onClick={handleProfileSave}
									idleText="Save changes"
								/>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="display-name">Display name</Label>
									<Input
										id="display-name"
										value={displayName}
										onChange={(event) => setDisplayName(event.target.value)}
										placeholder="Ms. Garcia"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="title-line">Role or title</Label>
									<Input
										id="title-line"
										value={teacherTitle}
										onChange={(event) => setTeacherTitle(event.target.value)}
										placeholder="STEM Pathways Coordinator"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="room-location">Primary room</Label>
									<Input
										id="room-location"
										value={roomLocation}
										onChange={(event) => setRoomLocation(event.target.value)}
										placeholder="Room 220"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="teacher-bio">Bio</Label>
									<textarea
										id="teacher-bio"
										className={textareaClassName}
										value={bio}
										onChange={(event) => setBio(event.target.value)}
										placeholder="Share your pathway focus, favorite projects, or how students can partner with you."
									/>
									<p className="text-xs text-muted-foreground">
										This appears on resource pages and helps students know your
										focus areas.
									</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="preferences" className="space-y-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between gap-4">
								<div>
									<CardTitle className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-primary" />
										Availability & office hours
									</CardTitle>
									<CardDescription>
										Set expectations for when students can reach out.
									</CardDescription>
								</div>
								<SaveButton
									state={fieldStatus.availability}
									onClick={handleAvailabilitySave}
									idleText="Save schedule"
								/>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="office-hours">Office hours</Label>
									<Input
										id="office-hours"
										value={officeHours}
										onChange={(event) => setOfficeHours(event.target.value)}
										placeholder="Tuesdays & Thursdays • 3:15 – 4:00 PM"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="availability-notes">Notes for students</Label>
									<textarea
										id="availability-notes"
										className={textareaClassName}
										value={availabilityNotes}
										onChange={(event) =>
											setAvailabilityNotes(event.target.value)
										}
										placeholder="Send a message before stopping by so I can open the lab."
									/>
								</div>
								<div className="flex items-center justify-between rounded-lg border px-4 py-3">
									<div>
										<p className="font-medium">
											Accepting new message requests
										</p>
									</div>
									<Switch
										checked={acceptingRequests}
										onCheckedChange={setAcceptingRequests}
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-6">
						<div className="grid gap-6 items-start lg:grid-rows-2">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between gap-4">
									<div>
										<CardTitle className="flex items-center gap-2">
											<Bell className="h-4 w-4 text-primary" />
											Alerts & messaging
										</CardTitle>
										<CardDescription>
											Stay informed when campus info needs quick attention.
										</CardDescription>
									</div>
									<SaveButton
										state={fieldStatus.alerts}
										onClick={handleAlertSave}
										idleText="Save alerts"
									/>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-center justify-between rounded-lg border px-4 py-3">
										<div>
											<p className="font-medium">Email announcements</p>
											<p className="text-sm text-muted-foreground">
												Get notified when students add resources or clubs.
											</p>
										</div>
										<Switch
											checked={emailAnnouncements}
											onCheckedChange={setEmailAnnouncements}
										/>
									</div>

									<div className="flex items-center justify-between rounded-lg border px-4 py-3">
										<div>
											<p className="font-medium">SMS alerts</p>
											<p className="text-sm text-muted-foreground">
												Text me with any updates.
											</p>
										</div>
										<Switch
											checked={urgentSms}
											onCheckedChange={setUrgentSms}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="alert-note">Additional notes</Label>
										<textarea
											id="alert-note"
											className={textareaClassName}
											value={alertNotes}
											onChange={(event) => setAlertNotes(event.target.value)}
											placeholder="Let us know if there’s a preferred contact method."
										/>
										<p className="text-xs text-muted-foreground">
											Notes are saved locally for quick reference.
										</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between gap-4">
									<div>
										<CardTitle className="flex items-center gap-2">
											Weekly Digest
										</CardTitle>
										<CardDescription>
											Get a recap of messages and student activity.
										</CardDescription>
									</div>
									<SaveButton
										state={fieldStatus["digest-day"]}
										onClick={handleDigestSave}
										idleText="Save digest"
									/>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-2">
										<Label>Weekday</Label>
										<div className="flex flex-wrap gap-2">
											{DIGEST_DAYS.map((day) => (
												<Button
													key={day}
													type="button"
													variant={
														day === weeklyDigestDay
															? "default"
															: "secondary"
													}
													size="sm"
													className={`rounded-3xl transition-colors ${
														day === weeklyDigestDay
															? "bg-primary text-primary-foreground hover:bg-primary-light"
															: "bg-muted text-foreground hover:bg-muted-foreground/80"
													}`}
													onClick={() => setWeeklyDigestDay(day)}
													aria-pressed={day === weeklyDigestDay}>
													{day.slice(0, 3)}
												</Button>
											))}
										</div>
									</div>

									<div className="grid w-full max-w-xs gap-2">
										<Label htmlFor="digest-time">Time</Label>
										<Input
											id="digest-time"
											type="time"
											value={weeklyDigestTime}
											onChange={(event) =>
												setWeeklyDigestTime(event.target.value)
											}
										/>
									</div>

									<p className="text-xs text-muted-foreground">
										Your weekly digest will send on {weeklyDigestDay}s at{" "}
										{weeklyDigestTime}.
									</p>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="security" className="space-y-6">
						<div className="grid gap-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-primary" />
										Update email
									</CardTitle>
									<CardDescription>
										Use the email you check most for urgent campus updates.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label>Current email</Label>
										<Input value={account?.email ?? ""} readOnly disabled />
									</div>
									<div className="space-y-2">
										<Label htmlFor="teacher-new-email">New email</Label>
										<Input
											id="teacher-new-email"
											type="email"
											value={emailInput}
											onChange={(event) => setEmailInput(event.target.value)}
											placeholder="you@example.org"
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
						</div>

						<div className="flex gap-2">
							<Button
								variant="secondary"
								className="w-full sm:w-auto"
								onClick={handlePasswordReset}
								title="Reset your password">
								Reset password
							</Button>
							<Button
								variant="outline"
								className="w-full sm:w-auto hover:bg-red-50 hover:text-red-600"
								onClick={handleLogout}>
								<LogOut className="h-4 w-4 mr-2" /> Log Out
							</Button>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</TeacherDashboardLayout>
	);
}

export default TeacherSettingsPage;
