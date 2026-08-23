import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { InlineScript } from "@/components/inline-script";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  title: "TimeLens - Productivity Intelligence",
  description: "Understand how you spend your time. Improve focus and build productive habits.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png" }],
  },
};

function AppProviders({ children }: { children: React.ReactNode }) {
  if (clerkPublishableKey) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem('timelens-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `html{background-color:#111318;color-scheme:dark}html:not(.dark){background-color:#F7F8FA;color-scheme:light}`,
          }}
        />
        
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <Providers>{children}</Providers>
        </AppProviders>
      </body>
    </html>
  );
}
