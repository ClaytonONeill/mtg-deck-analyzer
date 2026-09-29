// Types
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  /**
   * `base` (bg-base-100) is the standard page background. `recessed`
   * (bg-base-200) is for pages whose content sits on raised `bg-base-100`
   * cards/inputs (builder, wishlist, objectives), which would lose all
   * contrast against a base-100 page.
   */
  tone?: "base" | "recessed";
  className?: string;
}

// Shared outer wrapper for every top-level page, so the page background and
// min-height don't drift per page.
export default function PageShell({
  children,
  tone = "base",
  className = "",
}: PageShellProps) {
  const bg = tone === "recessed" ? "bg-base-200" : "bg-base-100";
  return (
    <div className={`min-h-screen ${bg} text-base-content ${className}`}>
      {children}
    </div>
  );
}
