import type { ReactNode } from "react";

/**
 * Standard body wrapper for every /flow/* page: keeps content readable on
 * 1920px (via max-w) without starving 1366px (via responsive padding).
 */
export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-flow px-6 py-6 lg:px-8">{children}</div>;
}
