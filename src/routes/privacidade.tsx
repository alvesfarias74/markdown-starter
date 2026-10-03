import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — A Seu Serviço" },
      { name: "description", content: "Como a A Seu Serviço trata seus dados pessoais." },
      { property: "og:title", content: "Política de Privacidade — A Seu Serviço" },
      { property: "og:description", content: "Como a A Seu Serviço trata seus dados pessoais." },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-3xl space-y-4 px-4 pt-12">
      <h1 className="text-4xl font-bold">Política de Privacidade</h1>
      <p className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">Versão provisória. O texto definitivo será publicado antes do lançamento.</p>
      <p className="text-muted-foreground">Seu e-mail e telefone não são exibidos publicamente. No perfil público aparecem apenas as informações profissionais que você escolher publicar, como nome, serviços, cidade e bairros atendidos. Nunca exibimos seu endereço residencial.</p>
    </section>
  ),
});
