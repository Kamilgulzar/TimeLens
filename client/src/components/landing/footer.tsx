"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Solutions: ["Individuals", "Teams", "Enterprise"],
  Resources: ["Documentation", "Blog", "Guides", "API"],
  Company: ["About", "Careers", "Contact", "Legal"],
};

export function Footer() {
  return (
    <footer className="border-t border-[#ECECEC] bg-[#FCFCFD] dark:border-[#2A2D35] dark:bg-[#0C0C10]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-12 sm:px-8 sm:py-14 lg:px-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 mb-10 sm:grid-cols-3 md:grid-cols-5 lg:gap-8">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Logo className="w-6 h-6" />
              <span className="text-[14px] font-semibold text-[#0B0B0F] dark:text-[#F5F5F7]">TimeLens</span>
            </Link>
            <p className="text-[13px] leading-[1.6] text-[#98A2B3] dark:text-[#6B7280] max-w-[220px]">
              Productivity intelligence for focused teams and individuals.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[12px] font-semibold text-[#111318] dark:text-[#F7F8FA] mb-3 uppercase tracking-[0.06em]">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-[13.5px] text-[#667085] dark:text-[#98A2B3] hover:text-[#111318] dark:hover:text-[#F7F8FA] transition-colors">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#ECECEC] dark:border-[#2A2D35] pt-6 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <p className="text-[12.5px] text-[#98A2B3] dark:text-[#6B7280]">&copy; {new Date().getFullYear()} TimeLens. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="#" className="text-[12.5px] text-[#98A2B3] dark:text-[#6B7280] hover:text-[#667085] dark:hover:text-[#98A2B3] transition-colors">Privacy</Link>
            <Link href="#" className="text-[12.5px] text-[#98A2B3] dark:text-[#6B7280] hover:text-[#667085] dark:hover:text-[#98A2B3] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
