import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="A Seu Serviço — início"><Logo /></Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link to="/categorias" className="hidden rounded-full px-3 py-2 text-muted-foreground hover:text-foreground sm:inline" activeProps={{ className: "text-foreground" }}>Categorias</Link>
          <Link to="/buscar" className="hidden rounded-full px-3 py-2 text-muted-foreground hover:text-foreground sm:inline" activeProps={{ className: "text-foreground" }}>Buscar</Link>
          <Link to="/para-profissionais" className="rounded-full bg-ink px-4 py-2 text-ink-foreground hover:opacity-90">Sou profissional</Link>
        </nav>
      </div>
    </header>
  );
}
