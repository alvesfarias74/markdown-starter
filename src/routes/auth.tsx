import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoogleButton } from "@/components/site/GoogleButton";
import { Field, inputClass } from "@/components/site/Field";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — A Seu Serviço" },
      { name: "description", content: "Acesse sua conta na A Seu Serviço." },
      { property: "og:title", content: "Entrar — A Seu Serviço" },
      { property: "og:description", content: "Acesse sua conta na A Seu Serviço." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/painel", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/painel", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  return (
    <section className="mx-auto max-w-md px-4 pt-12">
      <h1 className="text-4xl font-bold">Entrar</h1>
      <p className="mt-2 text-muted-foreground">Acesse sua conta para continuar.</p>
      <div className="mt-8 space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
        <GoogleButton />
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            setBusy(false);
            if (error) toast.error(error.message.includes("confirmed") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos.");
          }}
        >
          <Field label="E-mail"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" /></Field>
          <Field label="Senha"><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" /></Field>
          <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Entrando..." : "Entrar"}</button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Presta serviços e ainda não tem conta? <Link to="/cadastro-profissional" className="font-semibold text-primary">Cadastre-se</Link>
      </p>
    </section>
  );
}
