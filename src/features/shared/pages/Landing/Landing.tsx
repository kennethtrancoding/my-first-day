import HeroSection from "@/components/Landing/HeroSection";
import OnboardingPreview from "@/components/Landing/OnboardingPreview";
import LandingFeatureShowcase from "@/components/Landing/LandingFeatureShowcase";
import CampusLifeSpotlight from "@/components/Landing/CampusLifeSpotlight";
import ClubExplorer from "@/components/Landing/ClubExplorer";
import LandingFooter from "@/components/Landing/Footer";
import LandingNavbar from "@/components/Landing/LandingNavbar";

const Index = () => {
	return (
		<div className="min-h-screen bg-background">
			<LandingNavbar />
			<main>
				<HeroSection />
				{/*<OnboardingPreview />
				<LandingFeatureShowcase />
				<CampusLifeSpotlight />
				<ClubExplorer />*/}
			</main>
			<LandingFooter />
		</div>
	);
};

export default Index;
