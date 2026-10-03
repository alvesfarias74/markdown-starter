import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — A Seu Serviço" },
      { name: "description", content: "Termos de Uso da plataforma A Seu Serviço." },
      { property: "og:title", content: "Termos de Uso — A Seu Serviço" },
      { property: "og:description", content: "Termos de Uso da plataforma A Seu Serviço." },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-3xl space-y-4 px-4 pt-12">
      <h1 className="text-4xl font-bold">Termos de Uso</h1>
      <p className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">Versão provisória. O texto definitivo será publicado antes do lançamento.</p>
      <p className="text-muted-foreground">A A Seu Serviço conecta pessoas que precisam de serviços a profissionais que os oferecem. Ao se cadastrar, você declara que as informações fornecidas são verdadeiras e que é responsável pelos serviços que anuncia e realiza.</p>
      <p className="text-muted-foreground">É proibido publicar conteúdo falso, ofensivo ou que viole direitos de terceiros. Perfis que descumprirem estas regras poderão ser suspensos.</p>
    </section>
  ),
});
