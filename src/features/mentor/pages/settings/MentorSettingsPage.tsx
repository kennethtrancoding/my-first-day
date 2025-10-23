import * as React from "react";
import {
	Loader2,
	CheckCircle2,
	User,
	Clock,
	Mail,
	Bell,
	Megaphone,
	BookOpen,
	Lock,
	LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentEmail, updateAccount, logout, findAccount } from "@/utils/auth";
import { interestOptions } from "@/constants";
import { useNavigate } from "react-router-dom";

const DIGEST_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatDigestTime(time: string) {
	const [hourString, minute] = time.split(":");
	if (!hourString || !minute) {
		return time;
	}
	const hour = Number(hourString);
	if (Number.isNaN(hour)) {
		return time;
	}
	const period = hour >= 12 ? "PM" : "AM";
	const hour12 = hour % 12 === 0 ? 12 : hour % 12;
	return `${hour12}:${minute} ${period}`;
}

type SaveState = "idle" | "saving" | "saved";

function SaveButton({
	state,
	children,
	onClick,
}: {
	state: SaveState;
	children: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<Button
			onClick={onClick}
			disabled={state === "saving"}
			className="inline-flex items-center">
			{state === "saving" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
			{state === "saved" && <CheckCircle2 className="mr-2 h-4 w-4" />}
			{children}
		</Button>
	);
}

const MentorSettingsPage = () => {
	const currentEmail = React.useMemo(() => getCurrentEmail(), []);
	const storageIdentity = currentEmail ?? "anonymous-mentor";
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:mentorSettings`,
		[storageIdentity]
	);
	const navigate = useNavigate();

	const account =
		currentEmail ? findAccount(currentEmail) : null;

	const fallbackName = React.useMemo(() => {
		if (!currentEmail) {
			return "Mentor";
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

		return "Mentor";
	}, [account, currentEmail]);

	React.useEffect(() => {
		if (!currentEmail || !account || account.role !== "mentor") {
			navigate("/", { replace: true });
		}
	}, [account, currentEmail, navigate]);

	const [displayName, setDisplayName] = useStoredState<string>(
		`${storagePrefix}:name`,
		() => fallbackName
	);
	const [nameStatus, setNameStatus] = React.useState<SaveState>("idle");

	const [mentorInterests, setMentorInterests] = useStoredState<string>(
		`${storagePrefix}:interests`,
		() => (account?.profile?.interests ?? []).join(", ")
	);
	const parsedInterests = React.useMemo(
		() =>
			mentorInterests
				.split(",")
				.map((value) => value.trim())
				.filter(Boolean),
		[mentorInterests]
	);
	const [interestsStatus, setInterestsStatus] = React.useState<SaveState>("idle");

	const [availability, setAvailability] = useStoredState<boolean>(
		`${storagePrefix}:availability`,
		() => {
			if (account?.settings?.availability != null) {
				return account.settings.availability;
			}
			return true;
		}
	);
	const [availabilityStatus, setAvailabilityStatus] = React.useState<SaveState>("idle");

	const [bio, setBio] = useStoredState<string>(`${storagePrefix}:bio`, () => {
		const savedBio = account?.profile?.mentorBio?.trim();
		if (savedBio) {
			return savedBio;
		}
		return "STEM lover excited to help new students get plugged into robotics and technology.";
	});
	const [bioStatus, setBioStatus] = React.useState<SaveState>("idle");

	const [officeHours, setOfficeHours] = useStoredState<string>(
		`${storagePrefix}:officeHours`,
		() => {
			const savedOfficeHours = account?.profile?.mentorOfficeHours?.trim();
			if (savedOfficeHours) {
				return savedOfficeHours;
			}
			return "Tuesdays & Thursdays, 3:15–4:00 PM";
		}
	);
	const [officeStatus, setOfficeStatus] = React.useState<SaveState>("idle");

	const preferredEmail = currentEmail || "mentor@example.org";

	const [emailNotifications, setEmailNotifications] = useStoredState<boolean>(
		`${storagePrefix}:emailNotifications`,
		() => {
			if (account?.settings?.emailNotificationsEnabled != null) {
				return account.settings.emailNotificationsEnabled;
			}
			return true;
		}
	);
	const [requestAlerts, setRequestAlerts] = useStoredState<boolean>(
		`${storagePrefix}:requestAlerts`,
		() => {
			if (account?.settings?.requestAlerts != null) {
				return account.settings.requestAlerts;
			}
			return true;
		}
	);
	const [digestWeekday, setDigestWeekday] = useStoredState<string>(
		`${storagePrefix}:digestWeekday`,
		() => account?.settings?.digestWeekday ?? "Friday"
	);
	const [digestTime, setDigestTime] = useStoredState<string>(
		`${storagePrefix}:digestTime`,
		() => account?.settings?.digestTime ?? "16:00"
	);
	const digestSummary = React.useMemo(() => {
		const dayLabel = digestWeekday.endsWith("s") ? digestWeekday : `${digestWeekday}s`;
		const timeLabel = digestTime ? formatDigestTime(digestTime) : "your selected time";
		return `${dayLabel} at ${timeLabel}`;
	}, [digestWeekday, digestTime]);
	const [notifStatus, setNotifStatus] = React.useState<SaveState>("idle");
	const [digestStatus, setDigestStatus] = React.useState<SaveState>("idle");

	function simulateSave(setter: React.Dispatch<React.SetStateAction<SaveState>>) {
		setter("saving");
		setTimeout(() => {
			setter("saved");
			setTimeout(() => setter("idle"), 1500);
		}, 900);
	}

	function handleAvailabilitySave() {
		if (currentEmail) {
			updateAccount(currentEmail, {
				settings: {
					availability,
				},
			});
		}
		simulateSave(setAvailabilityStatus);
	}

	function handleBioSave() {
		if (currentEmail) {
			updateAccount(currentEmail, {
				profile: {
					mentorBio: bio,
				},
			});
		}
		simulateSave(setBioStatus);
	}

	function handleOfficeHoursSave() {
		if (currentEmail) {
			updateAccount(currentEmail, {
				profile: {
					mentorOfficeHours: officeHours,
				},
			});
		}
		simulateSave(setOfficeStatus);
	}

	function handleInterestsSave() {
		if (currentEmail) {
			updateAccount(currentEmail, {
				profile: {
					interests: parsedInterests,
				},
			});
		}
		simulateSave(setInterestsStatus);
	}

	function handleNotifSave() {
		if (currentEmail) {
			updateAccount(currentEmail, {
				settings: {
					emailNotificationsEnabled: emailNotifications,
					requestAlerts,
				},
			});
		}
		simulateSave(setNotifStatus);
	}

	function handleDigestSave() {
		if (currentEmail) {
			updateAccount(currentEmail, {
				settings: {
					digestWeekday,
					digestTime,
				},
			});
		}
		simulateSave(setDigestStatus);
	}

	function handlePasswordReset() {
		const initialEmailState = currentEmail ?? "";
		navigate("/reset-password/", { state: { email: initialEmailState } });
	}

	function handleLogout() {
		logout();
		navigate("/");
	}

	function handleChangeSchools() {
		logout();
		navigate("/verification/");
	}

	function handleNameSave() {
		const nameToPersist = (displayName ?? "").trim() || fallbackName || "Mentor";
		setDisplayName(nameToPersist);

		if (currentEmail) {
			updateAccount(currentEmail, {
				profile: {
					displayName: nameToPersist,
				},
			});
		}

		simulateSave(setNameStatus);
	}

	return (
		<MentorDashboardLayout activePage="settings">
			<div className="container mx-auto px-4 space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Mentor Settings</h1>
					<p className="text-muted-foreground">
						Keep your profile accurate and your availability current so students know
						what to expect.
					</p>
				</div>

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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<User className="h-4 w-4 text-primary" />
										Profile Name
									</CardTitle>
									<CardDescription>
										This name appears to students in mentor search and
										messaging.
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="mentor-name">Name</Label>
									<Input
										id="mentor-name"
										value={displayName}
										onChange={(event) => setDisplayName(event.target.value)}
										placeholder={fallbackName}
									/>
								</div>
								<SaveButton state={nameStatus} onClick={handleNameSave}>
									Save Name
								</SaveButton>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<User className="h-4 w-4 text-primary" />
										Mentor Bio
									</CardTitle>
									<CardDescription>
										Students will see this when browsing available mentors.
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="mentor-bio">Short Bio</Label>
									<textarea
										id="mentor-bio"
										value={bio}
										onChange={(event) => setBio(event.target.value)}
										className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px]"
									/>
								</div>
								<SaveButton state={bioStatus} onClick={handleBioSave}>
									Save Bio
								</SaveButton>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Contact Information</CardTitle>
								<CardDescription>
									This is shared with approved students for follow-up questions.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label>Email</Label>
									<div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<span>{preferredEmail}</span>
									</div>
									<p className="text-xs text-muted-foreground">
										Update your email through the district portal if needed.
									</p>
								</div>
								<div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
									Keep your profile accurate so students always know how to reach
									you and what to expect from mentoring sessions.
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="preferences" className="space-y-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<BookOpen className="h-4 w-4 text-primary" />
										Interests
									</CardTitle>
									<CardDescription>
										Choose the areas where you can support students.
									</CardDescription>
								</div>
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
													setMentorInterests(() => {
														const next = isSelected
															? parsedInterests.filter(
																	(existing) => existing !== tag
															  )
															: [...parsedInterests, tag];
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
								<SaveButton state={interestsStatus} onClick={handleInterestsSave}>
									Save Interests
								</SaveButton>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-secondary" />
										Availability
									</CardTitle>
									<CardDescription>
										Toggle visibility when you're accepting new mentee requests.
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
									<div>
										<p className="font-medium">
											{availability
												? "Accepting new students"
												: "Currently full"}
										</p>
										<p className="text-sm text-muted-foreground">
											Students can only request mentors who are available.
										</p>
									</div>
									<Switch
										checked={availability}
										onCheckedChange={(checked) => setAvailability(checked)}
										aria-label="Toggle mentor availability"
									/>
								</div>
								<SaveButton
									state={availabilityStatus}
									onClick={handleAvailabilitySave}>
									Save Availability
								</SaveButton>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Office Hours</CardTitle>
								<CardDescription>
									Let students know when you can meet virtually or on campus.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="office-hours">Office Hours</Label>
									<Input
										id="office-hours"
										value={officeHours}
										onChange={(event) => setOfficeHours(event.target.value)}
									/>
								</div>
								<SaveButton state={officeStatus} onClick={handleOfficeHoursSave}>
									Save Office Hours
								</SaveButton>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="security" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Lock className="h-4 w-4 text-destructive" />
									Security
								</CardTitle>
								<CardDescription>
									Manage access to your mentor account.
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
										onClick={handleChangeSchools}>
										Change Schools
									</Button>
									<Button
										variant="outline"
										className="w-full sm:w-auto"
										onClick={handleLogout}>
										<LogOut className="h-4 w-4 mr-2" /> Log Out
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Bell className="h-4 w-4" /> Notification Preferences
								</CardTitle>
								<CardDescription>
									Control how you receive mentor program updates.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div>
										<p className="font-medium">Email notifications</p>
										<p className="text-sm text-muted-foreground">
											Messages, requests, reminders
										</p>
									</div>
									<Switch
										checked={emailNotifications}
										onCheckedChange={setEmailNotifications}
									/>
								</div>
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div>
										<p className="font-medium">New mentee request alerts</p>
										<p className="text-sm text-muted-foreground">
											Instant alert when a student requests you
										</p>
									</div>
									<Switch
										checked={requestAlerts}
										onCheckedChange={setRequestAlerts}
									/>
								</div>
								<SaveButton state={notifStatus} onClick={handleNotifSave}>
									Save Notification Settings
								</SaveButton>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Megaphone className="h-4 w-4" /> Weekly Digest
								</CardTitle>
								<CardDescription>
									Get a recap of messages and student activity.
								</CardDescription>
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
													day === digestWeekday ? "default" : "secondary"
												}
												size="sm"
												className={`rounded-3xl transition-colors ${
													day === digestWeekday
														? "bg-primary text-primary-foreground hover:bg-primary-light"
														: "bg-muted text-foreground hover:bg-muted-foreground/80"
												}`}
												onClick={() => setDigestWeekday(day)}
												aria-pressed={day === digestWeekday}>
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
										value={digestTime}
										onChange={(event) => setDigestTime(event.target.value)}
									/>
								</div>
								<p className="text-xs text-muted-foreground">
									Your weekly digest will send on {digestSummary}.
								</p>
								<SaveButton state={digestStatus} onClick={handleDigestSave}>
									Save Digest Schedule
								</SaveButton>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorSettingsPage;
