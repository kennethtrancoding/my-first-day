import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";
import {
	Loader2,
	Lock,
	Bell,
	User,
	LogOut,
	BookOpen,
	Shirt,
	ArrowRight,
	Users,
} from "lucide-react";
import * as React from "react";
import StudentDashboardLayout from "@/features/student/components/StudentDashboardLayout";
import { interestOptions } from "@/constants";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentEmail, updateAccount, logout, findAccount } from "@/utils/auth";

type SaveState = "idle" | "saving" | "saved";
type FieldKey = "name" | "interests" | "clothingSize" | "bio" | "notifications";

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
	const currentEmail = React.useMemo(() => getCurrentEmail(), []);
	const storageIdentity = currentEmail ?? "anonymous-student";
	const storagePrefix = React.useMemo(
		() => `user:${storageIdentity}:studentSettings`,
		[storageIdentity]
	);

	const account = currentEmail ? findAccount(currentEmail) : null;

	const fallbackName = React.useMemo(() => {
		if (!currentEmail) {
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

	const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useStoredState<boolean>(
		`${storagePrefix}:emailNotificationsEnabled`,
		() => {
			if (account?.settings?.emailNotificationsEnabled != null) {
				return account.settings.emailNotificationsEnabled;
			}
			return true;
		}
	);

	const [fieldStatus, setFieldStatus] = React.useState<FieldStatusMap>({
		name: "idle",
		interests: "idle",
		clothingSize: "idle",
		bio: "idle",
		notifications: "idle",
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

	function handleSavePreferences(field: FieldKey) {
		if (field === "name") {
			const trimmedName = username.trim();
			const nextName = trimmedName || fallbackName;
			if (trimmedName !== username || !trimmedName) {
				setUsername(nextName);
			}

			if (currentEmail) {
				updateAccount(currentEmail, {
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
					updateAccount(currentEmail, {
						profile: {
							interests: parsedInterests,
						},
					});
					break;
				case "clothingSize":
					updateAccount(currentEmail, {
						profile: {
							clothingSize,
						},
					});
					break;
				case "bio":
					updateAccount(currentEmail, {
						profile: {
							bio,
						},
					});
					break;
				case "notifications":
					updateAccount(currentEmail, {
						settings: {
							emailNotificationsEnabled,
						},
					});
					break;
			}
		}
		simulateSave(field);
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
			updateAccount(currentEmail, { role: "mentor" });
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<User className="h-5 w-5 text-primary" />
										Profile Information
									</CardTitle>
									<CardDescription>
										Manage your name and email address.
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										placeholder={fallbackName}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="email">Email</Label>
									<Input id="email" type="email" value={email} disabled />
									<p className="text-xs text-muted-foreground">
										Email address cannot be changed.
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
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="h-5 w-5 text-primary" />
									Bio
								</CardTitle>
								<CardDescription>
									This will show up alongside your name when people search for
									you.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid w-full  items-center gap-1.5">
									<Label htmlFor="clothing-size">Bio</Label>
									<textarea
										id="bio"
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
									/>
								</div>
								<SaveButton
									state={fieldStatus.bio}
									onClick={() => handleSavePreferences("bio")}
									idleText="Save Bio"
								/>
							</CardContent>
						</Card>
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
								{/* Email notifications */}
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

								{/* Push notifications (coming soon) */}
								<div className="flex items-start justify-between gap-4 rounded-xl border p-4 opacity-60">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<Label
												htmlFor="push-notifs"
												className="text-base font-medium">
												Push Notifications
											</Label>
											<Badge variant="secondary">Coming soon</Badge>
										</div>
										<p className="text-sm text-muted-foreground">
											Native push alerts for mentions and direct messages.
										</p>
									</div>
									<div className="flex items-center gap-3">
										<Switch id="push-notifs" disabled />
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
