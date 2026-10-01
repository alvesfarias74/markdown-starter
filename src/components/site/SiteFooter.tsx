import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">Você precisa de um serviço. Nós ajudamos você a encontrar quem faz.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Para quem contrata</p>
          <Link to="/buscar" className="block text-muted-foreground hover:text-foreground">Buscar profissionais</Link>
          <Link to="/categorias" className="block text-muted-foreground hover:text-foreground">Categorias</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Para profissionais</p>
          <Link to="/para-profissionais" className="block text-muted-foreground hover:text-foreground">Oferecer meus serviços</Link>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} A Seu Serviço</p>
    </footer>
  );
}
