import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Images, Inbox, Star } from "lucide-react";

export const Route = createFileRoute("/para-profissionais")({
  head: () => ({
    meta: [
      { title: "Ofereça seus serviços — A Seu Serviço" },
      { name: "description", content: "Crie sua vitrine profissional, receba pedidos de orçamento e conquiste novos clientes na sua região." },
      { property: "og:title", content: "Ofereça seus serviços — A Seu Serviço" },
      { property: "og:description", content: "Crie sua vitrine profissional e conquiste novos clientes na sua região." },
    ],
  }),
  component: ProPage,
});

const perks = [
  { icon: BadgeCheck, title: "Sua vitrine profissional", text: "Um perfil público seu, mesmo sem ter site." },
  { icon: Images, title: "Portfólio", text: "Mostre fotos dos trabalhos que você já fez." },
  { icon: Inbox, title: "Pedidos de orçamento", text: "Receba oportunidades de clientes da sua região." },
  { icon: Star, title: "Reputação", text: "Cada serviço bem feito vira avaliação no seu perfil." },
];

function ProPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="max-w-2xl text-4xl font-extrabold sm:text-6xl">Você presta serviços?</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">Cadastre-se e encontre novos clientes.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border bg-card p-6">
            <Icon className="h-6 w-6 text-primary" />
            <p className="mt-4 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-3xl bg-accent p-8 text-accent-foreground">
        <p className="font-display text-2xl font-bold">Cadastro de profissionais em breve</p>
        <p className="mt-1">Estamos preparando o cadastro. Logo você poderá criar sua vitrine.</p>
      </div>
    </section>
  );
}
