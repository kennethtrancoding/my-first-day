import * as React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/Home/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notifications } from "@/constants";

interface DashboardLayoutProps {
	activePage: string;
	children: React.ReactNode;
}

function DashboardLayout({ activePage, children }: DashboardLayoutProps) {
	const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);

	return (
		<SidebarProvider>
			<div className="flex min-h-screen bg-background w-full">
				<DashboardSidebar activePage={activePage} />

				<main className="flex-1 p-8">
					<nav className="flex justify-evenly items-center mb-6">
						<SidebarTrigger />
						<div className="flex justify-center w-full pointer-events-none">
							<h1 className="text-3xl font-bold pointer-events-auto hidden sm:block">
								Hollencrest Middle School
							</h1>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="ml-auto"
							onClick={() => setIsNotificationOpen(true)}
							aria-label="View notifications">
							<Bell className="h-5 w-5" />
						</Button>
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
											className="flex flex-col p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer">
											<p className="text-sm font-medium">{notif.message}</p>
											<p className="text-xs text-muted-foreground mt-1">
												{notif.time}
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

export default DashboardLayout;
