import * as React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import MentorDashboardSidebar from "./MentorDashboardSidebar";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { findAccount, getCurrentEmail } from "@/utils/auth";

interface MentorDashboardLayoutProps {
	activePage: string;
	children: React.ReactNode;
}

function MentorDashboardLayout({ activePage, children }: MentorDashboardLayoutProps) {
	const navigate = useNavigate();
	const currentEmail = React.useMemo(() => getCurrentEmail(), []);
	const account = React.useMemo(
		() => (currentEmail ? findAccount(currentEmail) : null),
		[currentEmail]
	);

	const hasCompletedOnboarding = account?.wentThroughOnboarding === true;
	const mentorType = account?.profile?.mentorType ?? "student";
	const isAuthorized = React.useMemo(
		() =>
			Boolean(
				currentEmail &&
					account &&
					account.role === "mentor" &&
					hasCompletedOnboarding &&
					mentorType !== "teacher"
			),
		[account, currentEmail, hasCompletedOnboarding, mentorType]
	);
	const shouldRedirectOnboarding = React.useMemo(
		() =>
			Boolean(
				currentEmail &&
					account &&
					account.role === "mentor" &&
					account.wentThroughOnboarding !== true
			),
		[account, currentEmail]
	);
	const shouldRedirectHome = React.useMemo(
		() => !currentEmail || !account || account.role !== "mentor",
		[account, currentEmail]
	);
	const shouldRedirectTeacher = React.useMemo(
		() =>
			Boolean(
				currentEmail &&
					account &&
					account.role === "mentor" &&
					account.profile?.mentorType === "teacher"
			),
		[account, currentEmail]
	);

	const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
	const { notifications, unreadCount, markAllRead } = useNotifications("mentor");

	React.useEffect(() => {
		if (shouldRedirectOnboarding) {
			navigate("/onboarding/", { replace: true });
			return;
		}

		if (shouldRedirectTeacher) {
			navigate("/teacher/home/", { replace: true });
			return;
		}

		if (shouldRedirectHome) {
			navigate("/", { replace: true });
		}
	}, [navigate, shouldRedirectHome, shouldRedirectOnboarding, shouldRedirectTeacher]);

	function formatTimestamp(timestamp: number) {
		try {
			return new Date(timestamp).toLocaleString([], {
				dateStyle: "short",
				timeStyle: "short",
			});
		} catch {
			return "";
		}
	}

	function formatTypeLabel(type?: string) {
		if (!type) return "Update";
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	React.useEffect(() => {
		if (isNotificationOpen) {
			markAllRead();
		}
	}, [isNotificationOpen, markAllRead]);

	if (!isAuthorized) {
		return null;
	}

	return (
		<SidebarProvider>
			<div className="flex min-h-screen bg-background w-full">
				<MentorDashboardSidebar activePage={activePage} />

				<main className="flex-1 p-8">
					<nav className="flex justify-evenly items-center mb-6">
						<SidebarTrigger />
						<div className="flex justify-center w-full pointer-events-none">
							<h1 className="text-3xl font-bold pointer-events-auto hidden sm:block">
								Hollencrest Middle School
							</h1>
						</div>
						<div className="relative ml-auto">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsNotificationOpen(true)}
								aria-label="View notifications">
								<Bell className="h-5 w-5" />
							</Button>
							{unreadCount > 0 && (
								<Badge
									variant="destructive"
									className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
									{unreadCount}
								</Badge>
							)}
						</div>
					</nav>
					{children}
				</main>

				<Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
					<SheetContent side="right" className="sm:max-w-md w-full p-0">
						<SheetHeader className="flex flex-row items-center justify-between p-4 border-b m-0">
							<SheetTitle className="text-xl font-bold">Notifications</SheetTitle>

							<SheetClose asChild>
								<button
									className="p-2 rounded-full transition-colors hover:bg-muted"
									aria-label="Close notifications">
									<X className="h-5 w-5 text-muted-foreground !m-0" />
								</button>
							</SheetClose>
						</SheetHeader>

						<ScrollArea className="h-[calc(100vh-5rem)]">
							<div className="flex flex-col">
								{notifications.length > 0 ? (
									notifications.map((notif) => (
										<div
											key={notif.id}
											className={`flex flex-col gap-2 p-4 border-b transition-colors ${
												notif.read
													? "hover:bg-muted/40"
													: "bg-muted/50 hover:bg-muted/40"
											}`}>
											<div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
												<Badge variant="outline" className="px-2 text-[10px]">
													{formatTypeLabel(notif.type)}
												</Badge>
												<span>{formatTimestamp(notif.createdAt)}</span>
											</div>
											<p className="text-sm font-medium leading-snug">
												{notif.message}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{notif.read ? "Read" : "New"}
											</p>
										</div>
									))
								) : (
									<p className="p-6 text-muted-foreground text-center">
										No new notifications.
									</p>
								)}
							</div>
						</ScrollArea>
					</SheetContent>
				</Sheet>
			</div>
		</SidebarProvider>
	);
}

export default MentorDashboardLayout;
