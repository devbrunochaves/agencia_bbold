"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { loginSchema } from "@/modules/identity/domain/login-schema";

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);

    if (authError) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-flow-text-muted">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-flow-border bg-flow-panel-alt px-3.5 py-2.5 text-sm text-flow-text-primary outline-none transition-colors placeholder:text-flow-text-muted focus:border-flow-yellow"
          placeholder="voce@agenciabbold.com.br"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-flow-text-muted">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-flow-border bg-flow-panel-alt px-3.5 py-2.5 text-sm text-flow-text-primary outline-none transition-colors placeholder:text-flow-text-muted focus:border-flow-yellow"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-flow-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-flow-yellow px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
