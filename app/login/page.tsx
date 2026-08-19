import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-flow-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-flow-border bg-flow-panel p-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-flow-yellow-ink">BBOLD</p>
          <h1 className="mt-1 text-2xl font-semibold text-flow-text-primary">Flow</h1>
          <p className="mt-2 text-sm text-flow-text-muted">
            Entre com sua conta para acessar a operação.
          </p>
        </div>
        <LoginForm redirectTo={redirectTo && redirectTo.startsWith("/flow") ? redirectTo : "/flow"} />
      </div>
    </main>
  );
}
