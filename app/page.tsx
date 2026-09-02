import { About } from "@/components/about";
import { Calculation } from "@/components/calculation";
import { Capabilities } from "@/components/capabilities";
import { Contact } from "@/components/contact";
import { SplineSceneBasic } from "@/components/demo";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <main>
        <SplineSceneBasic />
        <Capabilities />
        <HowItWorks />
        <Calculation />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
