import type { ReactNode } from "react";

/** Used before the AppShell even mounts — no sidebar, no navigation, just the message. */
export default function FullScreenMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dark flex h-screen items-center justify-center bg-flow-bg px-4 text-center text-flow-text-primary">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-flow-yellow">BBOLD</p>
        <h1 className="mt-1 text-xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-flow-text-muted">{children}</p>
      </div>
    </div>
  );
}
