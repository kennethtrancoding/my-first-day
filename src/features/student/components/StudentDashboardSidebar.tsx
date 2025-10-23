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
import { useMemo } from "react";
import { findAccount, getCurrentEmail } from "@/utils/auth";

interface StudentDashboardSidebarProps {
	activePage: string;
}

const sidebarMenuList = ["Home", "Messages", "Clubs", "Resources", "Settings"];

function StudentDashboardSidebar({ activePage }: StudentDashboardSidebarProps) {
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
		const fullName =
			first && last ? `${first} ${last}` : first ?? profile.displayName?.trim();

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
					{sidebarMenuList.map((item) => {
						const slug = item.toLowerCase();
						const destination =
							slug === "home" ? "/student/home/" : `/student/home/${slug}/`;

						return (
							<SidebarMenuItem key={item} className="flex w-full justify-center">
								<SidebarMenuButton
									isActive={activePage === slug}
									tooltip={item}
									className="pl-5"
									onClick={() => navigate(destination)}>
									{item}
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="p-4">
				<Button className="w-full" onClick={() => navigate("/")}>
					Log Out
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}

export default StudentDashboardSidebar;
