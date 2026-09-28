import type { Metadata } from "next";
import Script from "next/script";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { ChatBot } from "@/components/ui/ChatBot";

const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-bricolage",
});

const bodyFont = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-public-sans",
});

const themeInitialization = `(()=>{try{const choice=localStorage.getItem("partjob-theme");const mode=choice==="light"||choice==="dark"?choice:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=mode;document.documentElement.style.colorScheme=mode}catch{document.documentElement.dataset.theme="light"}})()`;

export const metadata: Metadata = {
  title: "PartJob — Part-time jobs & internships for students",
  description: "Find part-time jobs and internships near your campus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} h-full`} suppressHydrationWarning>
      <head>
        <Script id="partjob-theme-initialization" strategy="beforeInteractive">
          {themeInitialization}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ThemeProvider>
            {children}
            <ToastContainer />
            <ChatBot />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
