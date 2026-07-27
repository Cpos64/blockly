import Link from "next/link";

const TABS = [
  { key: "planner", label: "Planner", href: "/" },
  { key: "calendar", label: "Calendar", href: "/plan" },
  { key: "routines", label: "Routines", href: "/routines" },
] as const;

export default function NavTabs({
  active,
}: {
  active: "planner" | "calendar" | "routines";
}) {
  return (
    <div className="flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-800">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded px-2.5 py-1 text-sm transition ${
            active === tab.key
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
