import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Github,
  Linkedin,
  LockKeyhole,
  Mail,
  MousePointer2,
  Moon,
  PanelTop,
  ShieldCheck,
  Sparkles,
  Sun,
  Twitter,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-provider";

const trustItems = [
  "Workspace planning",
  "Project visibility",
  "Task ownership",
  "Member roles",
  "Secure sessions",
  "Team analytics",
  "Google OAuth",
  "Invite flows",
];

const proofCards = [
  {
    key: "review",
    label: "faster task review loops",
    message: "Review note sent",
    animationType: "visual",
    animationUrl: "https://lottiefiles.com/free-animation/progress-sIHqzR7yUg",
    visual: "progress",
  },
  {
    key: "followup",
    label: "less status chasing",
    message: "Status update delivered",
    animationType: "visual",
    visual: "search",
  },
  {
    key: "delivery",
    label: "on-time delivery clarity",
    message: "Timeline shared",
    animationType: "visual",
    visual: "work",
  },
  {
    key: "alignment",
    label: "team alignment lift",
    message: "Team synced",
    animationType: "visual",
    visual: "help",
  },
];

const flowSteps = [
  {
    icon: ClipboardList,
    title: "Collect project demand",
    text: "New work enters one workspace with context, priority, due dates, and project scope.",
  },
  {
    icon: ShieldCheck,
    title: "Route ownership",
    text: "Admins assign members, roles, permissions, and task owners across departments.",
  },
  {
    icon: BellRing,
    title: "Review execution",
    text: "Managers track backlog, in-progress work, review queues, blockers, and status changes.",
  },
  {
    icon: CheckCircle2,
    title: "Measure delivery",
    text: "Analytics show completion, workload, team activity, and what needs attention next.",
  },
];

const featureGroups = [
  {
    icon: Workflow,
    title: "Workspace operations",
    text: "Create multiple workspaces, projects, tasks, members, and role-based access rules.",
  },
  {
    icon: CalendarCheck,
    title: "Delivery rhythm",
    text: "Priorities, due dates, task status, filters, and pagination keep execution manageable.",
  },
  {
    icon: BarChart3,
    title: "Progress intelligence",
    text: "Workspace and project analytics show what is active, blocked, and complete.",
  },
  {
    icon: LockKeyhole,
    title: "SaaS foundation",
    text: "React, Node.js, Express, MongoDB, Passport auth, sessions, and protected routes.",
  },
];

const reviews = [
  {
    name: "Harshal Shah",
    role: "Product Lead",
    quote:
      "TeamSync made project ownership visible from day one. Our team finally knows what is moving and who owns it.",
  },
  {
    name: "Lakshika Singh",
    role: "Operations Manager",
    quote:
      "Invites, roles, project filters, and analytics reduced our daily follow-up load immediately.",
  },
  {
    name: "Prajwal",
    role: "Engineering Lead",
    quote:
      "The workspace flow is clean. Tasks move from backlog to review without losing department context.",
  },
  {
    name: "Kunal Gautam",
    role: "Project Manager",
    quote:
      "Sprint reviews became easier because TeamSync keeps projects, members, and delivery status connected.",
  },
  {
    name: "Uttam Choudhary",
    role: "Team Admin",
    quote:
      "Role-based permissions and workspace visibility give our team a much more professional SaaS workflow.",
  },
  {
    name: "Krishna Prasad Jadi",
    role: "Founder",
    quote:
      "TeamSync feels ready for real teams: clear onboarding, task ownership, and useful delivery intelligence.",
  },
];

const actionCards = [
  {
    title: "Before TeamSync",
    text: "Tasks live in chats, ownership is unclear, and project status depends on manual follow-ups.",
  },
  {
    title: "During the sprint",
    text: "Members get assigned work, due dates, priorities, and project filters in one place.",
  },
  {
    title: "After delivery",
    text: "Analytics show progress, workspace records stay clean, and teams know what shipped.",
  },
];

const developerLinks = [
  {
    label: "GitHub",
    href: "https://github.com/H4rshalshah",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/h4rshal/",
    icon: Linkedin,
  },
  {
    label: "Twitter / X",
    href: "https://x.com/H4rshalshah",
    icon: Twitter,
  },
];

const gmailComposeUrl =
  "https://mail.google.com/mail/?view=cm&fs=1&to=h4rshal.workspace@gmail.com&su=TeamSync%20Query&body=Hi%20Harshal%2C%0A%0AI%20have%20a%20query%20about%20TeamSync.%0A%0A";

const commandCenterRows = [
  {
    project: "Website Redesign",
    owner: "Alex",
    team: ["AL", "JS", "MK", "PN", "RV"],
    tasks: "24/30",
    progress: 80,
    status: "In Progress",
    due: "Jun 12",
    review: "Design QA",
  },
  {
    project: "Mobile App",
    owner: "Sarah",
    team: ["SA", "NK", "DV", "OM", "RI", "TE"],
    tasks: "42/50",
    progress: 84,
    status: "Review Ready",
    due: "Jun 15",
    review: "Stakeholder",
  },
  {
    project: "API Integration",
    owner: "John",
    team: ["JO", "AR", "KC"],
    tasks: "10/18",
    progress: 55,
    status: "Blocked",
    due: "Jun 18",
    review: "Dependency",
  },
  {
    project: "Marketing Campaign",
    owner: "Emma",
    team: ["EM", "LS", "VP", "HN", "GR"],
    tasks: "35/35",
    progress: 100,
    status: "Completed",
    due: "Jun 10",
    review: "Approved",
  },
];

const Landing = () => {
  const [isCompact, setIsCompact] = useState(false);
  const [proofValues, setProofValues] = useState({
    review: "4.2x",
    followup: "87%",
    delivery: "98%",
    alignment: "71%",
  });
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const networkRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setIsCompact(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll(".sphinx-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateNetworkProgress = () => {
      const element = networkRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const centerY = rect.top + rect.height / 2;
      const distanceFromCenter = Math.abs(centerY - viewportHeight * 0.5);
      const activeRange = viewportHeight * 0.35;
      const rawProgress = Math.max(0, Math.min(1, 1 - distanceFromCenter / activeRange));
      // Smooth ease-out curve for more visible expand/shrink
      const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
      element.style.setProperty("--network-progress", progress.toString());
      element.style.setProperty("--network-offset", `${800 * (1 - progress)}`);
      element.style.setProperty("--network-line-opacity", progress > 0.01 ? (0.3 + progress * 0.7).toString() : "0");
    };

    updateNetworkProgress();
    window.addEventListener("scroll", updateNetworkProgress, { passive: true });
    window.addEventListener("resize", updateNetworkProgress);

    return () => {
      window.removeEventListener("scroll", updateNetworkProgress);
      window.removeEventListener("resize", updateNetworkProgress);
    };
  }, []);

  useEffect(() => {
    const updateValues = () => {
      setProofValues({
        review: `${(3.9 + Math.random() * 0.8).toFixed(1)}x`,
        followup: `${Math.round(82 + Math.random() * 10)}%`,
        delivery: `${Math.round(94 + Math.random() * 5)}%`,
        alignment: `${Math.round(68 + Math.random() * 9)}%`,
      });
    };

    const interval = window.setInterval(updateValues, 260);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="sphinx-shell min-h-screen overflow-hidden text-[#171512]">
      <header className={`sphinx-nav ${isCompact ? "sphinx-nav-compact" : ""}`}>
        <nav className="mx-auto flex items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <Logo noLink />
            <span className="text-lg">TeamSync</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-[#171512]/65 md:flex">
            <a href="#network" className="hover:text-[#171512]">
              Network
            </a>
            <a href="#features" className="hover:text-[#171512]">
              Platform
            </a>
            <a href="#reviews" className="hover:text-[#171512]">
              Reviews
            </a>
            <a href="#contact" className="hover:text-[#171512]">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sphinx-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="sphinx-button sphinx-signup-glow">
              <Link to="/sign-up">
                Sign up
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="sphinx-reveal text-center">
              <div className="sphinx-hero-badge mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-sm backdrop-blur-xl">
                <Sparkles className="size-4 text-[#8ee6a9]" />
                Project management that moves like a guided workspace
              </div>
              <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-8xl">
                Coordinate Effortlessly, Track Progress, and Meet Goals
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#171512]/68">
                Bring your team, tasks, and projects together in one powerful
                workspace. Stay aligned, monitor progress in real time, and
                achieve your goals faster with seamless collaboration and
                streamlined project management.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="sphinx-button sphinx-signup-glow">
                  <Link to="/sign-up">
                    Sign up
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="sphinx-outline">
                  <a href="#network">
                    See the network
                    <MousePointer2 />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="sphinx-marquee border-y border-black/10 bg-white/45 py-4 backdrop-blur-xl">
          <div className="sphinx-marquee-track">
            {Array.from({ length: 8 }, () => trustItems)
              .flat()
              .map((item, index) => (
              <span key={`${item}-${index}`} className="sphinx-marquee-pill">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
          <div className="sphinx-reveal max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase text-[#2f6f4e]">
              Project Command View
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-6xl">
              See members, tasks, and delivery status in one structured view.
            </h2>
            <p className="mt-5 mx-auto max-w-xl text-lg leading-8 text-[#171512]/65">
              A workspace should show who is involved, what is assigned, where
              work is blocked, and which projects are ready for review.
            </p>
          </div>

          <div className="sphinx-reveal team-meeting-visual command-center-visual mt-14 max-w-5xl mx-auto" aria-hidden="true">
            <div className="command-center-card">
              <div className="command-center-header">
                <div>
                  <span className="command-center-eyebrow">Workspace Command</span>
                  <h3>Project Delivery</h3>
                </div>
                <span className="command-center-chip">Live</span>
              </div>

              <div className="command-center-table">
                <div className="command-center-row command-center-head">
                  <span>Project</span>
                  <span>Owner</span>
                  <span>Team</span>
                  <span>Tasks</span>
                  <span>Progress</span>
                  <span>Status</span>
                  <span>Due</span>
                  <span>Review</span>
                </div>
                {commandCenterRows.map((row) => (
                  <div className="command-center-row" key={row.project}>
                    <span className="command-project-name">{row.project}</span>
                    <span>{row.owner}</span>
                    <span className="command-avatar-stack">
                      {row.team.slice(0, 4).map((member) => (
                        <i key={member}>{member}</i>
                      ))}
                      {row.team.length > 4 && <b>+{row.team.length - 4}</b>}
                    </span>
                    <span>{row.tasks}</span>
                    <span className="command-progress-cell">
                      <em>
                        <strong style={{ width: `${row.progress}%` }} />
                      </em>
                      {row.progress}%
                    </span>
                    <span
                      className={`command-status command-status-${row.status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {row.status}
                    </span>
                    <span>{row.due}</span>
                    <span className="command-review-state">{row.review}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {proofCards.map((card) => (
            <div key={card.label} className="sphinx-reveal sphinx-stat-card">
              <div className="sphinx-stat-animation" aria-hidden="true">
                {card.animationType === "video" ? (
                  <video
                    src={card.animationUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className={`sphinx-stat-visual sphinx-stat-visual-${card.visual}`}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
              <p className="text-4xl font-semibold">{proofValues[card.key as keyof typeof proofValues]}</p>
              <p className="mt-2 text-sm text-[#171512]/60">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="network" className="sphinx-project-network-section py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-16 lg:items-center">
            <div className="sphinx-reveal">
              <p className="text-sm font-semibold uppercase text-[#ba5b35]">
                Project Network
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-6xl">
                Add people into every project path.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#171512]/65">
                TeamSync connects stakeholders, owners, designers, engineers, and
                reviewers around the same workspace flow, so every project moves
                from brief to reporting without losing context.
              </p>
            </div>

            <div
              ref={networkRef}
              className="sphinx-network-map sphinx-network-hub sphinx-reveal mt-10 lg:mt-0"
            >
            <svg
              className="sphinx-network-lines"
              viewBox="0 0 1180 620"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M590 89 V306" />
              <path d="M313 206 C420 220 535 220 590 306" />
              <path d="M867 206 C760 220 645 220 590 306" />
              <path d="M313 306 H590" />
              <path d="M867 306 H590" />
              <path d="M313 516 C420 395 535 395 590 306" />
              <path d="M867 516 C760 395 645 395 590 306" />
              <path d="M590 531 V306" />
            </svg>

            <div className="network-hub-core" aria-hidden="true">
              <Sparkles className="size-16" />
            </div>

            <div className="network-pill network-pill-brief">Project brief</div>
            <div className="network-pill network-pill-workspace">
              Workspace
            </div>
            <div className="network-pill network-pill-invite">Invite members</div>
            <div className="network-pill network-pill-tasks">Task board</div>
            <div className="network-pill network-pill-review">Owner review</div>
            <div className="network-pill network-pill-reports">Reports</div>
            <div className="network-pill network-pill-analytics">
              Analytics
            </div>
            <div className="network-pill network-pill-status">Status updates</div>
          </div>
        </div>
      </div>
      </section>

      <section id="how" className="sphinx-flow-section border-y border-black/10 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="sphinx-reveal max-w-3xl">
            <p className="text-sm font-semibold uppercase text-[#2f6f4e]">
              The Flow
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-6xl">
              Scroll through the same path your team follows.
            </h2>
          </div>
          <div className="sphinx-flow-grid mt-14">
            {flowSteps.map((step, index) => (
              <article
                key={step.title}
                className="sphinx-reveal sphinx-flow-card"
                style={{ animationDelay: `${index * 180}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-full bg-[#171512] text-white">
                    <step.icon className="size-5" />
                  </span>
                  <span className="text-sm text-[#171512]/45">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#171512]/62">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="sphinx-reveal">
            <p className="text-sm font-semibold uppercase text-[#2f6f4e]">
              Platform
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-6xl">
              A SaaS foundation with the busywork removed.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#171512]/65">
              Built with React, Node.js, Express, MongoDB, Passport, sessions,
              protected routes, permissions, invites, analytics, and a clean
              dashboard for project teams.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureGroups.map((feature) => (
              <article key={feature.title} className="sphinx-reveal sphinx-feature-card">
                <feature.icon className="size-7 text-[#2f6f4e]" />
                <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-[#171512]/62">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="sphinx-reveal sphinx-sticky-copy">
            <p className="text-sm font-semibold uppercase text-[#2f6f4e]">
              In Action
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-6xl">
              One workspace replaces scattered project noise.
            </h2>
          </div>
          <div className="grid gap-5">
            {actionCards.map((card, index) => (
              <article
                key={card.title}
                className="sphinx-reveal sphinx-wide-card"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                <PanelTop className="size-6 text-[#ba5b35]" />
                <h3 className="mt-5 text-2xl font-semibold">{card.title}</h3>
                <p className="mt-3 text-[#171512]/62">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="sphinx-review-section pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="sphinx-reveal mx-auto max-w-4xl text-center">
            <p className="mx-auto inline-flex rounded-full border border-[#9fb9da] bg-[#edf5ff] px-5 py-2 text-sm font-semibold uppercase tracking-wide text-[#4f72a0]">
              Trusted by teams
            </p>
            <h2 className="mt-8 text-4xl font-semibold tracking-normal sm:text-6xl">
              Team feedback that validates the workflow.
            </h2>
          </div>
          <div className="sphinx-review-marquee mt-24">
            <div className="sphinx-review-track">
              {[...reviews, ...reviews].map((review, index) => (
                <article key={`${review.name}-${index}`} className="sphinx-review-card">
                  <div className="flex items-center gap-2.5">
                    <span className="sphinx-review-avatar">
                      {review.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-semibold leading-tight">{review.name}</h3>
                      <p className="text-[14px] text-[#171512]/50 leading-normal mt-0.5">{review.role}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[15px] leading-snug text-[#171512]/62 line-clamp-3">
                    "{review.quote}"
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 border-t border-black/10 pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo noLink />
            <span className="text-base font-semibold">TeamSync</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm font-semibold">Contact</span>
            <a
              href={gmailComposeUrl}
              target="_blank"
              rel="noreferrer"
              className="sphinx-footer-link"
              aria-label="Email developer"
            >
              <Mail className="size-4" />
            </a>
            {developerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="sphinx-footer-link"
                aria-label={link.label}
              >
                <link.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
