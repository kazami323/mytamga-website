import { Calculation } from "@/components/calculation";
import { Capabilities } from "@/components/capabilities";
import { SplineSceneBasic } from "@/components/demo";
import { HowItWorks } from "@/components/how-it-works";

export default function Home() {
  return (
    <main>
      <SplineSceneBasic />
      <Capabilities />
      <HowItWorks />
      <Calculation />
    </main>
  );
}
