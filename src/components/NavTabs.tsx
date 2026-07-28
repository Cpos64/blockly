"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
          className={`relative rounded px-2.5 py-1 text-sm transition ${
            active === tab.key
              ? "text-white dark:text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          {active === tab.key && (
            <motion.span
              layoutId="nav-tab-pill"
              className="absolute inset-0 rounded bg-neutral-900 dark:bg-neutral-100"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative">{tab.label}</span>
        </Link>
      ))}
    </div>
  );
}
