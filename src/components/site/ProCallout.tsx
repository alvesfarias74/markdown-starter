import { Link } from "@tanstack/react-router";

export function ProCallout() {
  return (
    <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-ink-foreground sm:p-12 md:flex-row md:items-center">
      <div className="max-w-xl">
        <h2 className="text-3xl font-bold sm:text-4xl">Você trabalha por conta própria?</h2>
        <p className="mt-2 text-lg opacity-80">Encontre novos clientes divulgando seus serviços gratuitamente na A Seu Serviço.</p>
      </div>
      <Link to="/cadastro-profissional" className="rounded-2xl bg-highlight px-6 py-4 font-semibold text-highlight-foreground hover:brightness-105">
        Quero cadastrar meus serviços
      </Link>
    </div>
  );
}

export function NoSocialCallout() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-primary/40 bg-accent p-8 text-accent-foreground">
      <p className="font-display text-2xl font-bold">Não importa se você não tem redes sociais.</p>
      <p className="mt-2 max-w-2xl">Crie seu perfil profissional e mostre seu trabalho para pessoas que estão procurando exatamente pelo que você faz.</p>
    </div>
  );
}
