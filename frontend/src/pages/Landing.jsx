import PublicNav from "../components/landing/PublicNav";
import Hero from "../components/landing/Hero";
import Stats from "../components/landing/Stats";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import { FAQ, CTA, Footer } from "../components/landing/FooterFaqCta";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
