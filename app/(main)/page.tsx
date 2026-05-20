import Hero from "@/components/Hero";
import Numbers from "@/components/Numbers";
import Services from "@/components/Services";
import MetodoBBold from "@/components/MetodoBBold";
import HowWeWork from "@/components/HowWeWork";
import CustomProjects from "@/components/CustomProjects";
import ProjectsPreview from "@/components/ProjectsPreview";
import About from "@/components/About";
import CtaBand from "@/components/CtaBand";
import Contact from "@/components/Contact";
import RevealInit from "@/components/RevealInit";

export default function Home() {
  return (
    <>
      <RevealInit />
      <Hero />
      <Numbers />
      <Services />
      <MetodoBBold />
      <HowWeWork />
      <CustomProjects />
      <ProjectsPreview />
      <About />
      <CtaBand />
      <Contact />
    </>
  );
}
