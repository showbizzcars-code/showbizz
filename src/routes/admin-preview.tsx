import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Star,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/admin-preview")({
  head: () => ({
    meta: [
      { title: "Dashboard Preview | Showbizz Cars" },
      { name: "description", content: "Read-only visual preview of the Showbizz Cars staff dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPreview,
});

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "cars", label: "Cars", icon: CarFront },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  { id: "posts", label: "Blog posts", icon: FileText },
  { id: "faqs", label: "FAQs", icon: CircleHelp },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type Tab = (typeof NAV)[number]["id"];

const CARS = [
  { name: "Toyota Innova Crysta", type: "SUV · 7 seats", rate: "₹5,500", status: "Published" },
  { name: "Hyundai Creta", type: "SUV · 5 seats", rate: "₹3,200", status: "Published" },
  { name: "Maruti Suzuki Ertiga", type: "MUV · 7 seats", rate: "₹2,800", status: "Draft" },
  { name: "Mahindra Thar", type: "SUV · 4 seats", rate: "₹4,500", status: "Published" },
];

const ENQUIRIES = [
  { initials: "AS", name: "Ananya Sharma", request: "Airport pickup", car: "Toyota Innova Crysta", date: "19 Oct, 10:24 AM", status: "New" },
  { initials: "AM", name: "Arjun Menon", request: "Family trip · 3 days", car: "Hyundai Creta", date: "19 Oct, 9:10 AM", status: "Replied" },
  { initials: "KR", name: "Kavya Raman", request: "Wedding travel", car: "Car of choice", date: "18 Oct, 5:45 PM", status: "New" },
  { initials: "MK", name: "Manoj Kumar", request: "Weekend rental", car: "Mahindra Thar", date: "18 Oct, 2:20 PM", status: "Closed" },
];

const POSTS = [
  { name: "A simple guide to choosing the right rental car", meta: "Guide · Updated 16 Oct 2026", status: "Published" },
  { name: "Planning a comfortable family road trip", meta: "Travel tips · Updated 12 Oct 2026", status: "Published" },
  { name: "What to check before your journey", meta: "Checklist · Draft", status: "Draft" },
];

const FAQS = [
  { name: "What documents should I bring?", meta: "Rental requirements", status: "Published" },
  { name: "Can I request a specific pickup time?", meta: "Booking enquiries", status: "Published" },
  { name: "How is the rental price confirmed?", meta: "Pricing", status: "Published" },
];

const REVIEWS = [
  { name: "R. Suresh", meta: "“Clean car and a smooth trip.”", status: "Published" },
  { name: "Meera P.", meta: "“The team was helpful and quick to reply.”", status: "Published" },
  { name: "Daniel K.", meta: "“Good experience with the family car.”", status: "Pending" },
];

function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = NAV.find((item) => item.id === activeTab)?.label ?? "Overview";
  const filteredCars = useMemo(
    () => CARS.filter((item) => `${item.name} ${item.type} ${item.status}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const filteredEnquiries = useMemo(
    () => ENQUIRIES.filter((item) => `${item.name} ${item.request} ${item.car} ${item.status}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="min-h-screen text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className={`${sidebarOpen ? "block" : "hidden"} border-b border-line bg-[#101214]/95 px-4 py-5 lg:block lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-5`}>
          <Link to="/" className="inline-flex items-center" aria-label="Showbizz Cars public site">
            <img src="/showbizz-cars-logo.svg" alt="Showbizz Cars" className="h-auto w-40 object-contain" />
          </Link>
          <div className="mt-7 rounded-lg border border-[#3a3f45] bg-[#1c2024]/80 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a5abb2]">Workspace</p>
            <p className="mt-1 text-sm font-medium">Showbizz Cars</p>
            <p className="mt-1 text-xs text-muted">Car management</p>
          </div>
          <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Menu</p>
          <nav aria-label="Dashboard preview menu" className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setQuery("");
                    setSidebarOpen(false);
                  }}
                  aria-current={selected ? "page" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${selected ? "border border-[#d9dde2]/20 bg-[#d9dde2] font-semibold text-[#101214]" : "text-[#c0c5cb] hover:bg-[#1c2024] hover:text-white"}`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span className="flex-1">{item.label}</span>
                  {item.id === "enquiries" ? (
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${selected ? "bg-black/10 text-[#101214]" : "bg-[#d9dde2]/10 text-[#d9dde2]"}`}>8</span>
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className="mt-10 rounded-xl border border-line bg-[#161a1e]/90 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 size={16} className="text-[#d9dde2]" />
              Preview environment
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">This is sample content only. Nothing here is saved or connected to customer records.</p>
          </div>
          <Link to="/" className="mt-5 flex min-h-10 items-center justify-between rounded-lg px-3 text-sm text-muted hover:bg-[#1c2024] hover:text-white">
            View public website <ChevronRight size={16} />
          </Link>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-line bg-[#101214]/80">
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-7 lg:px-9">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((open) => !open)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink lg:hidden"
                  aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                >
                  <span className="text-xl leading-none">{sidebarOpen ? "×" : "☰"}</span>
                </button>
                <div>
                  <p className="text-xs text-muted">Showbizz Cars / Staff desk</p>
                  <h1 className="mt-1 font-display text-2xl sm:text-3xl">{pageTitle}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative block">
                  <span className="sr-only">Search preview content</span>
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search preview…"
                    className="h-10 w-44 rounded-lg border border-line bg-[#15191c] pl-9 pr-3 text-sm text-ink outline-none placeholder:text-[#78818a] focus:border-[#9ca3aa] sm:w-56"
                  />
                </label>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d9dde2] text-xs font-bold text-[#101214]">SC</span>
                  <span className="hidden text-sm sm:inline">Client admin</span>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#41464c] bg-[#1c2024]/90 px-4 py-3 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d9dde2]/10 text-[#e4e7eb]">
                  <EyeIcon />
                </span>
                <div>
                  <p className="text-sm font-semibold">Dashboard preview</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Sample data for design review. Live data, editing, and saving are intentionally disabled.</p>
                </div>
              </div>
              <span className="rounded-full border border-[#d9dde2]/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d9dde2]">Read only</span>
            </div>

            {activeTab === "overview" ? (
              <Overview query={query} enquiries={filteredEnquiries} />
            ) : activeTab === "cars" ? (
              <CarsView cars={filteredCars} />
            ) : activeTab === "enquiries" ? (
              <EnquiriesView enquiries={filteredEnquiries} />
            ) : activeTab === "posts" ? (
              <ListView title="Blog posts" description="Manage travel guides and news shown on the public website." items={POSTS.filter((x) => `${x.name} ${x.meta} ${x.status}`.toLowerCase().includes(query.toLowerCase()))} icon="post" />
            ) : activeTab === "faqs" ? (
              <ListView title="Frequently asked questions" description="Clear answers for common customer questions." items={FAQS.filter((x) => `${x.name} ${x.meta} ${x.status}`.toLowerCase().includes(query.toLowerCase()))} icon="faq" />
            ) : activeTab === "reviews" ? (
              <ListView title="Customer reviews" description="Review customer feedback before displaying it on the public website." items={REVIEWS.filter((x) => `${x.name} ${x.meta} ${x.status}`.toLowerCase().includes(query.toLowerCase()))} icon="review" />
            ) : (
              <SettingsView query={query} />
            )}
            <p className="mt-10 border-t border-line pt-5 text-center text-[11px] text-muted">SHOWBIZZ CARS · STAFF DESK PREVIEW · SAMPLE DATA ONLY</p>
          </main>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return <span aria-hidden="true" className="text-base">◉</span>;
}

function Overview({ query, enquiries }: { query: string; enquiries: typeof ENQUIRIES }) {
  const stats = [
    { label: "Cars listed", value: "12", note: "9 published · 3 drafts", icon: CarFront, trend: "+2 this month" },
    { label: "New enquiries", value: "08", note: "Need a response", icon: MessageSquare, trend: "+3 this week" },
    { label: "Published articles", value: "06", note: "Travel guides and news", icon: FileText, trend: "2 drafts ready" },
    { label: "Customer reviews", value: "14", note: "12 shown on website", icon: Star, trend: "2 to review" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Monday, 19 October 2026</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl">Good afternoon</h2>
          <p className="mt-2 text-sm text-muted">Here’s a quick look at your car rental enquiries and website content.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-[#d9dde2]" /> Preview workspace
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <section key={stat.label} className="rounded-xl border border-line bg-[#161a1e]/95 p-5 transition hover:border-[#58616a]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="mt-3 font-display text-3xl tabular-nums sm:text-4xl">{stat.value}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9dde2]/10 bg-[#d9dde2]/5 text-[#d9dde2]">
                  <Icon size={19} strokeWidth={1.7} />
                </span>
              </div>
              <p className="mt-4 text-xs text-muted">{stat.note}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-[#c8cdd3]">
                {index === 2 ? <Clock3 size={13} /> : <TrendingUp size={13} />} {stat.trend}
              </p>
            </section>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-line bg-[#161a1e]/95">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-xl">Recent enquiries</h2>
              <p className="mt-1 text-xs text-muted">Latest messages from potential customers</p>
            </div>
            <span className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted">Sample list</span>
          </div>
          <EnquiryTable enquiries={enquiries.slice(0, 4)} />
          {enquiries.length === 0 ? <p className="px-5 py-8 text-sm text-muted">No sample enquiries match “{query}”.</p> : null}
        </section>

        <section className="rounded-xl border border-line bg-[#161a1e]/95 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">Enquiry activity</h2>
              <p className="mt-1 text-xs text-muted">Illustrative volume over the last 7 days</p>
            </div>
            <TrendingUp size={18} className="text-[#d9dde2]" />
          </div>
          <div className="mt-7 flex h-36 items-end justify-between gap-2 border-b border-line pb-2">
            {[38, 58, 44, 76, 52, 91, 67].map((height, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-[#6d747c] to-[#d9dde2]" style={{ height: `${height}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-6 rounded-lg border border-line bg-[#101214]/60 p-3">
            <p className="text-xs text-muted">Weekly total</p>
            <p className="mt-1 text-2xl font-semibold">32 <span className="text-xs font-normal text-muted">sample enquiries</span></p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-line bg-[#161a1e]/95">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-xl">Cars at a glance</h2>
            <p className="mt-1 text-xs text-muted">Example listings and their current display status</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted"><CarFront size={15} /> 4 sample cars</div>
        </div>
        <CarsTable cars={CARS.slice(0, 3)} />
      </section>
    </div>
  );
}

function CarsView({ cars }: { cars: typeof CARS }) {
  return (
    <section className="rounded-xl border border-line bg-[#161a1e]/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-5">
        <div>
          <h2 className="font-display text-2xl">Cars</h2>
          <p className="mt-1 text-sm text-muted">Example car listings, daily rates, and publishing status.</p>
        </div>
        <span className="rounded-lg border border-line px-3 py-2 text-xs text-muted">Read-only preview</span>
      </div>
      <CarsTable cars={cars} />
      {cars.length === 0 ? <p className="px-5 py-8 text-sm text-muted">No sample cars match your search.</p> : null}
    </section>
  );
}

function CarsTable({ cars }: { cars: typeof CARS }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-[#101214]/60 text-[10px] uppercase tracking-[0.16em] text-muted">
          <tr><th className="px-5 py-3 font-medium">Car</th><th className="px-5 py-3 font-medium">Daily rate</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Preview</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {cars.map((car) => (
            <tr key={car.name} className="transition hover:bg-white/[0.02]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg border border-line bg-[#20252a] text-[#d9dde2]"><CarFront size={21} /></span>
                  <div><p className="font-medium">{car.name}</p><p className="mt-1 text-xs text-muted">{car.type}</p></div>
                </div>
              </td>
              <td className="px-5 py-4 font-medium tabular-nums">{car.rate}<span className="ml-1 text-xs font-normal text-muted">/day</span></td>
              <td className="px-5 py-4"><StatusPill status={car.status} /></td>
              <td className="px-5 py-4 text-xs text-muted">Sample only <ChevronRight className="ml-1 inline" size={13} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnquiriesView({ enquiries }: { enquiries: typeof ENQUIRIES }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-[#161a1e]/95">
      <div className="border-b border-line px-5 py-5">
        <h2 className="font-display text-2xl">Customer enquiries</h2>
        <p className="mt-1 text-sm text-muted">A sample of how incoming website enquiries will appear.</p>
      </div>
      <EnquiryTable enquiries={enquiries} />
      {enquiries.length === 0 ? <p className="px-5 py-8 text-sm text-muted">No sample enquiries match your search.</p> : null}
    </section>
  );
}

function EnquiryTable({ enquiries }: { enquiries: typeof ENQUIRIES }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#101214]/60 text-[10px] uppercase tracking-[0.16em] text-muted">
          <tr><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Request</th><th className="px-5 py-3 font-medium">Car</th><th className="px-5 py-3 font-medium">Received</th><th className="px-5 py-3 font-medium">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {enquiries.map((item) => (
            <tr key={item.name} className="transition hover:bg-white/[0.02]">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-[#22272c] text-xs font-semibold text-[#e3e7eb]">{item.initials}</span><div><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted">••••••• · Demo contact</p></div></div></td>
              <td className="px-5 py-4">{item.request}</td><td className="px-5 py-4 text-muted">{item.car}</td><td className="px-5 py-4 whitespace-nowrap text-xs text-muted">{item.date}</td><td className="px-5 py-4"><StatusPill status={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListView({ title, description, items, icon }: { title: string; description: string; items: { name: string; meta: string; status: string }[]; icon: "post" | "faq" | "review" }) {
  const Icon = icon === "post" ? FileText : icon === "faq" ? CircleHelp : Star;
  return (
    <section className="rounded-xl border border-line bg-[#161a1e]/95">
      <div className="border-b border-line px-5 py-5"><h2 className="font-display text-2xl">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p></div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div key={item.name} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-[#20252a] text-[#d9dde2]"><Icon size={18}/></span><div className="min-w-0"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted">{item.meta}</p></div></div>
            <StatusPill status={item.status} />
          </div>
        ))}
        {items.length === 0 ? <p className="px-5 py-8 text-sm text-muted">No sample items match your search.</p> : null}
      </div>
    </section>
  );
}

function SettingsView({ query }: { query: string }) {
  const groups = [
    { title: "Business details", description: "Name, contact number, email, and address" },
    { title: "Social media", description: "Instagram, Facebook, LinkedIn, and other profile links" },
    { title: "WhatsApp enquiries", description: "Contact number used for enquiry follow-ups" },
    { title: "Website content", description: "Default text and public website details" },
  ].filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="rounded-xl border border-line bg-[#161a1e]/95">
      <div className="border-b border-line px-5 py-5"><h2 className="font-display text-2xl">Website settings</h2><p className="mt-1 text-sm text-muted">A preview of the settings sections. Actual account details are not loaded here.</p></div>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        {groups.map((group) => <div key={group.title} className="rounded-xl border border-line bg-[#101214]/65 p-5"><p className="font-medium">{group.title}</p><p className="mt-2 text-sm leading-6 text-muted">{group.description}</p><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c7ccd2]">Not connected in preview</p></div>)}
        {groups.length === 0 ? <p className="text-sm text-muted">No sample settings match your search.</p> : null}
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === "Published" || status === "Replied"
      ? "border-[#859b8c]/30 bg-[#859b8c]/10 text-[#b9d0c0]"
      : status === "New"
        ? "border-[#d9dde2]/25 bg-[#d9dde2]/10 text-[#e1e5e9]"
        : status === "Pending" || status === "Draft"
          ? "border-[#b9a27c]/30 bg-[#b9a27c]/10 text-[#d8c6a7]"
          : "border-line bg-[#20252a] text-muted";

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${className}`}>{status}</span>;
}
