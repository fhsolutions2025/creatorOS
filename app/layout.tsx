import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Globe, Workflow } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "creatorOS — Build websites & automate workflows",
  description: "No-code website builder + workflow automator powered by Claude AI",
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/builder", label: "Builder", icon: Globe },
  { href: "/workflows", label: "Workflows", icon: Workflow },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full flex">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0" style={{ backgroundColor: "#0f0f0f" }}>
          {/* Logo */}
          <div className="px-6 py-5 border-b border-white/10">
            <span className="text-white font-bold text-lg tracking-tight">
              creator<span className="text-indigo-400">OS</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors group"
              >
                <Icon size={16} className="shrink-0 group-hover:text-indigo-400 transition-colors" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-white/30 text-xs">Powered by Claude AI</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </body>
    </html>
  );
}
