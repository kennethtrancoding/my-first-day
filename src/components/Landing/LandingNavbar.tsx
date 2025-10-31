import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { findAccount, getCurrentId } from "@/utils/auth";
import { Home, Menu } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [{ label: "Home", to: "/" }];

function redirectToDashboard() {
	const id = getCurrentId();
	const account = id ? findAccount(id) : null;

	if (!id || !account) {
		window.location.href = "/log-in/";
		return;
	}

	if (account.role === "student") {
		window.location.href = "/student/home/";
		return;
	}

	if (account.role === "mentor") {
		const mentorType = account.profile.mentorType ?? "student";
		window.location.href = mentorType === "teacher" ? "/teacher/home/" : "/mentor/home/";
		return;
	}

	window.location.href = "/";
}

const LandingNavbar = () => {
	return (
		<header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-transparent backdrop-blur-xl">
			<div className="container mx-auto flex items-center justify-between px-4 py-4">
				<Link
					to="/"
					className="text-base font-semibold tracking-tight text-white md:text-lg">
					My First Day
				</Link>

				<nav className="items-center gap-6 text-sm font-medium text-white/80 md:flex">
					<Link to="/" className="hidden md:inline-flex" onClick={redirectToDashboard}>
						Dashboard
					</Link>
				</nav>

				<div className="flex items-center gap-2 md:gap-3">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-white hover:bg-white/10 md:hidden"
								aria-label="Open navigation">
								<Menu size={20} />
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="bg-slate-950/95 text-white border-white/10">
							<div className="mt-10 flex flex-col gap-6">
								{navLinks.map((link) => (
									<SheetClose asChild key={link.to}>
										<Link
											to={link.to}
											className="text-lg font-medium tracking-tight">
											{link.label}
										</Link>
									</SheetClose>
								))}

								<div className="flex flex-col gap-3">
									<SheetClose asChild>
										<Button
											variant="ghost"
											className="w-full text-white"
											asChild>
											<Link to="/log-in/">Log In</Link>
										</Button>
									</SheetClose>
									<SheetClose asChild>
										<Button variant="hero" className="w-full" asChild>
											<Link to="/sign-up/">Create Account</Link>
										</Button>
									</SheetClose>
								</div>
							</div>
						</SheetContent>
					</Sheet>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							className="hidden text-white hover:bg-white/10 md:inline-flex"
							asChild>
							<Link to="/log-in/">Log In</Link>
						</Button>
						<Button
							variant="hero"
							size="sm"
							className="hidden shadow-lg md:inline-flex"
							asChild>
							<Link to="/sign-up/">Create Account</Link>
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
};

export default LandingNavbar;
