import { Button } from "../ui/button";
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarSeparator,
	SidebarFooter,
} from "../ui/sidebar";
import { useNavigate } from "react-router-dom";
import placeholderProfile from "@/assets/placeholder-profile.svg";

interface DashboardSidebarProps {
	activePage: string;
}

const sidebarMenuList = ["Home", "Messages", "Clubs", "Resources", "Settings"];

function DashboardSidebar({ activePage }: DashboardSidebarProps) {
	const navigate = useNavigate();

	return (
		<Sidebar>
			<SidebarHeader className="flex items-center gap-2 p-4 flex-col">
				<img src={placeholderProfile} className="rounded-full w-11 h-11 mt-2"></img>
				<p className="text-lg font-bold">Kenneth Tran</p>
			</SidebarHeader>
			<SidebarContent>
				<SidebarMenu>
					{sidebarMenuList.map((item) => {
						const slug = item.toLowerCase();
						const destination = slug === "home" ? "/home/" : `/home/${slug}/`;

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

export default DashboardSidebar;
