import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/categories";

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {CATEGORIES.map(({ slug, name, icon: Icon, examples }) => (
        <Link key={slug} to="/buscar" search={{ categoria: slug }} className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-soft">
          <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <p className="font-semibold">{name}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{examples.join(", ")}</p>
        </Link>
      ))}
    </div>
  );
}
