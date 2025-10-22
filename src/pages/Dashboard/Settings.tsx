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
import DashboardLayout from "@/components/Home/DashboardLayout";
import { interestOptions } from "@/constants";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

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

function SettingsPage() {
	const [username, setUsername] = React.useState("Kenneth Tran");
	const [email] = React.useState("215164@wcusd.net");

	const [selectedInterests, setSelectedInterests] = React.useState<string>("");
	const [clothingSize, setClothingSize] = React.useState("M");
	const [bio, setBio] = React.useState("");

	const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState<boolean>(true);

	const [fieldStatus, setFieldStatus] = React.useState<FieldStatusMap>({
		name: "idle",
		interests: "idle",
		clothingSize: "idle",
		bio: "idle",
		notifications: "idle",
	});
	const navigate = useNavigate();

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

	function handleSavePreferences(field: FieldKey) {
		simulateSave(field);
	}

	const handleLogout = () => {
		navigate("/");
	};

	return (
		<DashboardLayout activePage="settings">
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
									state={fieldStatus.clothingSize}
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
								<Button
									variant="secondary"
									onClick={() =>
										alert("Application to become a Peer Mentor initiated!")
									}>
									Apply To Become A Peer Mentor
									<ArrowRight size={16} className="ml-2" />
								</Button>
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
										const isSelected = selectedInterests
											.split(",")
											.map((s) => s.trim())
											.includes(tag);

										return (
											<Button
												key={tag}
												type="button"
												variant={isSelected ? "default" : "secondary"}
												size="sm"
												onClick={() =>
													setSelectedInterests((prev) => {
														const arr = prev
															.split(",")
															.map((s) => s.trim())
															.filter(Boolean);
														if (arr.includes(tag)) {
															return arr
																.filter((t) => t !== tag)
																.join(", ");
														} else {
															return [...arr, tag].join(", ");
														}
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
										onClick={() => alert("Password reset initiated!")}>
										Change Password
									</Button>
									<Button
										variant="outline"
										className="w-full sm:w-auto"
										onClick={() => alert("All other sessions logged out!")}>
										Log Out Other Devices
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* UPDATED NOTIFICATIONS TAB */}
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
					<Button
						variant="outline"
						className="w-full sm:w-auto hover:bg-red-50 hover:text-red-600"
						onClick={handleLogout}>
						<LogOut className="h-4 w-4 mr-2" /> Log Out
					</Button>
				</div>
			</div>
		</DashboardLayout>
	);
}

export default SettingsPage;
