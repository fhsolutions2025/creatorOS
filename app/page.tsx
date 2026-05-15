import Link from "next/link";
import { Globe, Workflow, ArrowRight, Zap } from "lucide-react";

const cards = [
  {
    href: "/builder",
    icon: Globe,
    title: "Website Builder",
    description:
      "Drag, drop, and design stunning pages with AI-generated copy. Add hero sections, feature grids, pricing tables, and more.",
    cta: "Open Builder",
    accent: "#6366f1",
  },
  {
    href: "/workflows",
    icon: Workflow,
    title: "Workflow Automator",
    description:
      "Connect triggers to actions visually. Send emails, call webhooks, update sheets — all without writing a line of code.",
    cta: "Open Workflows",
    accent: "#6366f1",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full px-10 py-12 bg-white">
      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} style={{ color: "#6366f1" }} />
          <span className="text-sm font-medium" style={{ color: "#6366f1" }}>
            Powered by Claude AI
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Welcome to creatorOS
        </h1>
        <p className="text-lg text-gray-500 max-w-xl">
          Build websites &amp; automate workflows —{" "}
          <span className="text-gray-900 font-medium">no code needed.</span>
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {cards.map(({ href, icon: Icon, title, description, cta }) => (
          <Link
            key={href}
            href={href}
            className="group relative flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-indigo-100"
          >
            {/* Icon */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#eef2ff" }}
            >
              <Icon size={22} style={{ color: "#6366f1" }} />
            </div>

            {/* Content */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1.5 text-sm font-medium mt-auto" style={{ color: "#6366f1" }}>
              {cta}
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-12 flex gap-8 text-sm text-gray-400">
        <span>
          <strong className="text-gray-900 font-semibold">6</strong> block types
        </span>
        <span>
          <strong className="text-gray-900 font-semibold">4</strong> action nodes
        </span>
        <span>
          <strong className="text-gray-900 font-semibold">∞</strong> possibilities
        </span>
      </div>
    </div>
  );
}
