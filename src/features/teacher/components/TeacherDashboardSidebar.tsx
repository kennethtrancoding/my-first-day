import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarFooter,
} from "@/components/ui/sidebar";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { findAccount, getCurrentEmail, logout } from "@/utils/auth";

interface TeacherDashboardSidebarProps {
	activePage: string;
}

const sidebarMenuItems = [
	{ label: "Overview", slug: "home", href: "/teacher/home/" },
	{ label: "Resources", slug: "resources", href: "/teacher/home/resources/" },
	{ label: "Map Editor", slug: "map", href: "/teacher/home/map/" },
	{ label: "Messages", slug: "messages", href: "/teacher/home/messages/" },
	{ label: "Settings", slug: "settings", href: "/teacher/home/settings/" },
];

function TeacherDashboardSidebar({ activePage }: TeacherDashboardSidebarProps) {
	const navigate = useNavigate();
	const currentEmail = useMemo(() => getCurrentEmail(), []);
	const account = useMemo(
		() => (currentEmail ? findAccount(currentEmail) ?? null : null),
		[currentEmail]
	);

	const displayName = useMemo(() => {
		const profile = account?.profile ?? {};
		const first = profile.firstName?.trim();
		const last = profile.lastName?.trim();
		const fullName = first && last ? `${first} ${last}` : first ?? profile.displayName?.trim();

		return fullName || account?.email || "Faculty Member";
	}, [account]);

	return (
		<Sidebar>
			<SidebarHeader className="flex items-center gap-2 p-4 flex-col">
				<img src={placeholderProfile} className="rounded-full w-11 h-11 mt-2" alt="" />
				<p className="text-lg font-bold text-center">{displayName}</p>
			</SidebarHeader>
			<SidebarContent>
				<SidebarMenu>
					{sidebarMenuItems.map((item) => (
						<SidebarMenuItem key={item.slug} className="flex w-full justify-center">
							<SidebarMenuButton
								isActive={activePage === item.slug}
								tooltip={item.label}
								className="pl-5"
								onClick={() => navigate(item.href)}>
								{item.label}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="flex flex-col text-center p-4">
				<p className="text-muted-foreground">Teacher account</p>
				<Button
					className="w-full"
					onClick={() => {
						logout();
						navigate("/");
					}}>
					Log Out
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}

export default TeacherDashboardSidebar;
