import LandingNav from "./LandingNav";
import Hero from "./Hero";
import Services from "./Services";
import HowItWorks from "./HowItWorks";
import CTA from "./CTA";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <Hero />
      <Services />
      <HowItWorks />
      <CTA />
      <LandingFooter />
    </div>
  );
}
