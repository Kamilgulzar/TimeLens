"use client";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Footer } from "@/components/landing/footer";
import { GrainOverlay } from "@/components/landing/grain-overlay";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FCFCFD] dark:bg-[#0C0C10]">
      <GrainOverlay />
      <Navbar />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
