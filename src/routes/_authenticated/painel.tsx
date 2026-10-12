import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

const NAV = [
  { to: "/painel", label: "Início", exact: true },
  { to: "/painel/servicos", label: "Meus serviços" },
  { to: "/painel/ganhos", label: "Ganhos" },
  { to: "/painel/avaliacoes", label: "Avaliações" },
  { to: "/painel/portfolio", label: "Portfólio" },
  { to: "/painel/disponibilidade", label: "Disponibilidade" },
  { to: "/painel/verificacao", label: "Verificação" },
  { to: "/painel/perfil", label: "Meu perfil" },
] as const;

export const Route = createFileRoute("/_authenticated/painel")({
  component: PainelLayout,
});

function PainelLayout() {
  return (
    <div>
      <nav className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 text-sm font-medium">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              className="shrink-0 rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
