"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} name="page-content" share="auto" enter="auto" default="none">
      {children}
    </ViewTransition>
  );
}
