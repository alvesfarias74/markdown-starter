import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountSchema } from "@/lib/professional";
import { Field, inputClass } from "@/components/site/Field";
import { GoogleButton } from "@/components/site/GoogleButton";

export const Route = createFileRoute("/cadastro-profissional")({
  head: () => ({
    meta: [
      { title: "Cadastre seus serviços grátis — A Seu Serviço" },
      { name: "description", content: "Crie sua vitrine profissional gratuita e mostre seu trabalho para clientes da sua região." },
      { property: "og:title", content: "Cadastre seus serviços grátis — A Seu Serviço" },
      { property: "og:description", content: "Crie sua vitrine profissional gratuita e mostre seu trabalho." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [f, setF] = useState({ full_name: "", email: "", phone: "", password: "", accept: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/painel/perfil", search: { passo: 1 }, replace: true }); });
  }, [navigate]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  if (sent)
    return (
      <section className="mx-auto max-w-md px-4 pt-16 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold">Confira seu e-mail</h1>
        <p className="mt-2 text-muted-foreground">Enviamos um link para <b>{f.email}</b>. Clique nele para confirmar e continuar montando seu perfil.</p>
      </section>
    );

  return (
    <section className="mx-auto max-w-lg px-4 pt-10">
      <p className="text-sm font-semibold text-primary">Passo 1 de 10 · Dados básicos</p>
      <h1 className="mt-1 text-4xl font-bold">Crie sua conta de profissional</h1>
      <p className="mt-2 text-muted-foreground">É grátis. Não precisa ter site nem redes sociais.</p>
      <div className="mt-8 space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
        <GoogleButton label="Cadastrar com Google" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou com e-mail<span className="h-px flex-1 bg-border" /></div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const errs: Record<string, string> = {};
            const parsed = accountSchema.safeParse({ full_name: f.full_name, phone: f.phone, accept_terms: f.accept });
            if (!parsed.success) parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
            if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errs["email"] = "E-mail inválido";
            if (f.password.length < 8) errs["password"] = "A senha precisa ter pelo menos 8 caracteres";
            setErrors(errs);
            if (Object.keys(errs).length) return;
            setBusy(true);
            const { error } = await supabase.auth.signUp({
              email: f.email.trim(),
              password: f.password,
              options: {
                emailRedirectTo: `${window.location.origin}/painel/perfil`,
                data: { full_name: f.full_name.trim(), phone: f.phone.trim(), terms_accepted: true },
              },
            });
            setBusy(false);
            if (error) return setErrors({ email: error.message.includes("registered") ? "Este e-mail já tem conta. Entre para continuar." : "Não foi possível criar a conta." });
            setSent(true);
          }}
        >
          <Field label="Nome" error={errors["full_name"]}><input value={f.full_name} onChange={set("full_name")} className={inputClass} autoComplete="name" maxLength={80} /></Field>
          <Field label="E-mail" error={errors["email"]}><input type="email" value={f.email} onChange={set("email")} className={inputClass} autoComplete="email" maxLength={255} /></Field>
          <Field label="Telefone (WhatsApp)" hint="Não aparece publicamente." error={errors["phone"]}><input type="tel" value={f.phone} onChange={set("phone")} placeholder="(85) 99999-9999" className={inputClass} autoComplete="tel" maxLength={20} /></Field>
          <Field label="Senha" hint="Mínimo de 8 caracteres." error={errors["password"]}><input type="password" value={f.password} onChange={set("password")} className={inputClass} autoComplete="new-password" /></Field>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={f.accept} onChange={set("accept")} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
            <span>Li e aceito os <Link to="/termos" target="_blank" className="font-semibold text-primary underline">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="font-semibold text-primary underline">Política de Privacidade</Link>.</span>
          </label>
          {errors["accept_terms"] && <p className="text-xs text-destructive">{errors["accept_terms"]}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-highlight py-3 font-semibold text-highlight-foreground disabled:opacity-60">{busy ? "Criando..." : "Criar conta e continuar"}</button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">Já tem conta? <Link to="/auth" className="font-semibold text-primary">Entrar</Link></p>
    </section>
  );
}
