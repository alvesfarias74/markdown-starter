import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const link = "hidden rounded-full px-3 py-2 text-muted-foreground hover:text-foreground sm:inline";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="A Seu Serviço — início"><Logo /></Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link to="/categorias" className={link} activeProps={{ className: "text-foreground" }}>Categorias</Link>
          <Link to="/buscar" className={link} activeProps={{ className: "text-foreground" }}>Buscar</Link>
          {ready && user ? (
            <>
              <Link to="/painel" className="rounded-full bg-ink px-4 py-2 text-ink-foreground hover:opacity-90">Meu painel</Link>
              <button
                type="button"
                className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  await qc.cancelQueries();
                  qc.clear();
                  await supabase.auth.signOut();
                  navigate({ to: "/auth", replace: true });
                }}
              >Sair</button>
            </>
          ) : (
            <>
              <Link to="/auth" className={link}>Entrar</Link>
              <Link to="/para-profissionais" className="rounded-full bg-ink px-4 py-2 text-ink-foreground hover:opacity-90">Sou profissional</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
