"use client";

import { logout } from "@/lib/auth-actions";

export default function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-neutral-100"
    >
      Log out
    </button>
  );
}
