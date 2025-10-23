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
import { useNavigate } from "react-router-dom";
import placeholderProfile from "@/assets/placeholder-profile.svg";
import { getCurrentEmail, findAccount, logout } from "@/utils/auth";
import { useMemo } from "react";

interface MentorDashboardSidebarProps {
	activePage: string;
}

const sidebarMenuItems = [
	{ label: "Home", slug: "home", href: "/mentor/home/" },
	{ label: "Requests", slug: "requests", href: "/mentor/home/requests/" },
	{ label: "Messages", slug: "messages", href: "/mentor/home/messages/" },
	{ label: "Clubs", slug: "clubs", href: "/mentor/home/clubs/" },
	{ label: "Resources", slug: "resources", href: "/mentor/home/resources/" },
	{ label: "Settings", slug: "settings", href: "/mentor/home/settings/" },
];

function MentorDashboardSidebar({ activePage }: MentorDashboardSidebarProps) {
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

		return fullName || account?.email || "Guest";
	}, [account]);

	return (
		<Sidebar>
			<SidebarHeader className="flex items-center gap-2 p-4 flex-col">
				<img src={placeholderProfile} className="rounded-full w-11 h-11 mt-2"></img>
				<p className="text-lg font-bold">{displayName}</p>
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
				<p className="text-muted-foreground">Mentor account</p>
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

export default MentorDashboardSidebar;
