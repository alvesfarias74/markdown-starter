import logoImg from "@/assets/logo.jpg";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`group inline-flex items-center gap-3 transition-transform duration-200 hover:scale-[1.02] ${className ?? ""}`}>
      <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/60 transition-shadow duration-200 group-hover:shadow-md">
        <img
          src={logoImg}
          alt="A Seu Serviço"
          className="h-10 w-10 object-cover sm:h-11 sm:w-11"
          width={44}
          height={44}
        />
      </span>
      <span className="font-display text-xl font-black tracking-tight text-foreground sm:text-2xl">
        A Seu Serviço<span className="text-highlight">.</span>
      </span>
    </span>
  );
}
