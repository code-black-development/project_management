import Link from "next/link";
import {
  CheckSquare,
  Users,
  Clock,
  ArrowRight,
  ChevronRight,
  LayoutGrid,
  Zap,
} from "lucide-react";

const appOrigin =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://app.localhost:3000";

function appLink(path: string) {
  return `${appOrigin}${path}`;
}

// ─── App UI Mockup ───────────────────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
      {/* Browser chrome */}
      <div className="bg-[#151821] px-4 py-3 flex items-center gap-3 border-b border-white/8">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-red-500/70" />
          <div className="size-3 rounded-full bg-yellow-500/70" />
          <div className="size-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 bg-[#0B0D12] rounded-md px-3 py-1 text-xs text-white/30 font-mono">
          app.fasta.work/workspaces/marketing-team
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-[420px] bg-[#0B0D12]">
        {/* Sidebar */}
        <div className="w-52 shrink-0 bg-[#151821] border-r border-white/8 p-3 flex flex-col gap-3">
          <div className="px-1 py-1">
            <span className="font-brand text-sm font-semibold text-white">
              fasta<span className="text-blue-400">.work</span>
            </span>
          </div>
          <div className="border-t border-white/8" />

          {/* Workspace switcher */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 cursor-pointer">
            <div className="size-6 rounded-md bg-blue-500/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-blue-400">M</span>
            </div>
            <span className="text-xs text-white/80 font-medium truncate">Marketing team</span>
            <ChevronRight className="size-3 text-white/30 ml-auto shrink-0" />
          </div>

          {/* Nav items */}
          <div className="flex flex-col gap-0.5">
            {[
              { label: "Home", active: false },
              { label: "My Tasks", active: false },
              { label: "Tasks", active: true },
              { label: "Members", active: false },
              { label: "Reports", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  item.active
                    ? "bg-blue-500/10 text-blue-400 border-l-2 border-blue-500"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 mt-1" />

          {/* Projects */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 px-2 mb-1.5">
              Projects
            </p>
            {["Website redesign", "Q3 Campaign", "Brand guidelines"].map(
              (p) => (
                <div
                  key={p}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group"
                >
                  <div className="size-4 rounded bg-white/10 shrink-0" />
                  <span className="text-xs text-white/40 truncate">{p}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="h-12 border-b border-white/8 flex items-center px-5 gap-3 shrink-0">
            <h1 className="text-sm font-semibold text-white/90">Tasks</h1>
            <div className="flex gap-1 ml-auto">
              {["List", "Board", "Calendar"].map((v) => (
                <div
                  key={v}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                    v === "Board"
                      ? "bg-[#202634] text-white/80"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* Kanban columns */}
          <div className="flex-1 p-4 flex gap-3 overflow-hidden">
            {[
              {
                label: "Todo",
                color: "text-red-400",
                bg: "bg-red-500/10",
                tasks: ["Write copy for homepage", "Review brand assets"],
              },
              {
                label: "In Progress",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
                tasks: ["Design system update", "SEO audit"],
              },
              {
                label: "Done",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                tasks: ["Competitor analysis", "Kick-off meeting"],
              },
            ].map((col) => (
              <div key={col.label} className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${col.color}`}
                  >
                    {col.label}
                  </span>
                  <span className="text-[10px] text-white/25">
                    {col.tasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.tasks.map((task) => (
                    <div
                      key={task}
                      className="bg-[#11151D] border border-white/8 rounded-lg p-3 cursor-pointer hover:bg-[#1B2130] transition-colors"
                    >
                      <p className="text-xs text-white/75 leading-snug">
                        {task}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${col.bg} ${col.color}`}
                        >
                          {col.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#0B0D12]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-brand text-lg font-semibold">
          fasta<span className="text-blue-400">.work</span>
        </span>

        <div className="flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block"
          >
            Pricing
          </Link>
          <a
            href={appLink("/sign-in")}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Sign in
          </a>
          <a
            href={appLink("/sign-up")}
            className="text-sm bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Get started free
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-40 pb-20 px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
          <Zap className="size-3.5 text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">
            Built for teams that ship
          </span>
        </div>

        <h1 className="font-brand text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
          Manage work at the
          <br />
          <span className="text-blue-400">speed of thought.</span>
        </h1>

        <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-xl mx-auto">
          fasta.work brings your team&apos;s tasks, projects, and progress into one
          focused workspace. Less noise, more momentum.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={appLink("/sign-up")}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
          >
            Get started free
            <ArrowRight className="size-4" />
          </a>
          <a
            href={appLink("/sign-in")}
            className="flex items-center gap-2 text-white/50 hover:text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm border border-white/10 hover:border-white/20"
          >
            I already have an account
            <ChevronRight className="size-4" />
          </a>
        </div>

        <p className="text-xs text-white/25 mt-4">
          Free plan available · No credit card required
        </p>
      </div>

      {/* App mockup */}
      <div className="mt-16 px-4">
        <AppMockup />
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: CheckSquare,
    title: "Tasks & Projects",
    description:
      "Organize work into projects with kanban boards, list views, and calendar. Track status, assignees, due dates, and subtasks — all in one place.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description:
      "Create dedicated workspaces for different teams or clients. Invite members, manage roles, and keep every team's work neatly separated.",
  },
  {
    icon: Clock,
    title: "Work Tracking",
    description:
      "Log time directly on tasks. Set time estimates and track actuals. See exactly where your team's effort is going with built-in reports.",
  },
  {
    icon: LayoutGrid,
    title: "Multiple Views",
    description:
      "Switch between list, board, and calendar views without losing context. Your tasks, your way — whatever helps your team move fastest.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-brand text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything your team needs
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            No bloat. No setup hell. Just the tools that actually move work
            forward.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[#11151D] border border-white/8 rounded-xl p-6 hover:border-white/15 transition-colors"
            >
              <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <f.icon className="size-5 text-blue-400" />
              </div>
              <h3 className="font-brand text-sm font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-white/45 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-[#11151D] border border-white/10 rounded-2xl p-12">
          <h2 className="font-brand text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to move faster?
          </h2>
          <p className="text-white/45 mb-8 text-lg">
            Start for free. No credit card required. Upgrade when your team
            grows.
          </p>
          <a
            href={appLink("/sign-up")}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors"
          >
            Create your workspace
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/8 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-brand text-sm font-semibold">
          fasta<span className="text-blue-400">.work</span>
        </span>

        <div className="flex items-center gap-6 text-xs text-white/30">
          <Link href="/pricing" className="hover:text-white/60 transition-colors">
            Pricing
          </Link>
          <a
            href={appLink("/sign-in")}
            className="hover:text-white/60 transition-colors"
          >
            Sign in
          </a>
          <a
            href={appLink("/sign-up")}
            className="hover:text-white/60 transition-colors"
          >
            Sign up
          </a>
        </div>

        <p className="text-xs text-white/20">
          © {new Date().getFullYear()} fasta.work
        </p>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </>
  );
}
