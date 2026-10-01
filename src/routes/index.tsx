import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, CalendarCheck, MessageSquareQuote, Star } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { SearchForm } from "@/components/site/SearchForm";
import { CategoryGrid } from "@/components/site/CategoryGrid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Seu Serviço — Encontre quem faz" },
      { name: "description", content: "Profissionais da sua região prontos para realizar o serviço que você precisa." },
      { property: "og:title", content: "A Seu Serviço — Encontre quem faz" },
      { property: "og:description", content: "Profissionais da sua região prontos para realizar o serviço que você precisa." },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: MessageSquareQuote, title: "Descreva o serviço", text: "Diga o que precisa e onde." },
  { icon: BadgeCheck, title: "Compare profissionais", text: "Perfis com portfólio, avaliações e disponibilidade." },
  { icon: CalendarCheck, title: "Contrate com segurança", text: "Receba orçamentos e combine tudo pela plataforma." },
  { icon: Star, title: "Avalie", text: "Sua avaliação ajuda toda a vizinhança." },
];

function Index() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 md:grid-cols-[1.2fr_1fr] md:pt-16">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">Serviços locais, gente de confiança</p>
          <h1 className="text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
            Encontre <span className="text-primary">quem faz</span><span className="text-highlight">.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">Profissionais da sua região prontos para realizar o serviço que você precisa.</p>
        </div>
        <div className="relative hidden md:block">
          <img src={hero} alt="Profissional sorrindo na porta de uma casa" width={1024} height={1280} className="aspect-[4/5] w-full rounded-3xl object-cover shadow-soft" />
        </div>
        <div className="md:col-span-2 md:-mt-24 md:w-[85%]">
          <SearchForm />
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold">O que você precisa resolver?</h2>
          <Link to="/categorias" className="text-sm font-semibold text-primary hover:underline">Ver todas</Link>
        </div>
        <CategoryGrid />
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <h2 className="mb-6 text-3xl font-bold">Como funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-2xl bg-secondary p-5">
              <div className="mb-4 flex items-center justify-between">
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-display text-3xl font-bold text-border">{i + 1}</span>
              </div>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-ink-foreground sm:p-12 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Você presta serviços?</h2>
            <p className="mt-2 text-lg opacity-80">Cadastre-se e encontre novos clientes.</p>
          </div>
          <Link to="/para-profissionais" className="rounded-2xl bg-highlight px-6 py-4 font-semibold text-highlight-foreground hover:brightness-105">
            Quero oferecer meus serviços
          </Link>
        </div>
      </section>
    </>
  );
}
