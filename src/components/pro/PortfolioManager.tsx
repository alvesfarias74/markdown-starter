import { useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { addPortfolioItem, deletePortfolioItem, updatePortfolioItem } from "@/lib/professionals.functions";
import { uploadImage } from "@/lib/upload";
import { CATEGORIES } from "@/lib/categories";
import { Field, inputClass } from "@/components/site/Field";
import type { ProfessionalView } from "@/lib/professional";

type Img = { path: string; url: string };
type RawItem = { id: string; title: string; description: string | null; category_slug: string | null; photos: string[]; before_photo: string | null; after_photo: string | null };

export function PickButton({ onPick, children }: { onPick: (f: File | undefined) => void; children: ReactNode }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button type="button" onClick={() => ref.current?.click()}>
      {children}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
    </button>
  );
}

function PhotoSlot({ label, value, onPick, onClear }: { label: string; value: string | undefined; onPick: (f: File | undefined) => void; onClear: () => void }) {
  return (
    <div className="relative">
      <PickButton onPick={onPick}>
        <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
          {value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1"><Camera className="h-6 w-6" />{label}</span>}
        </span>
      </PickButton>
      {value && <button type="button" onClick={onClear} aria-label="Remover foto" className="absolute right-2 top-2 rounded-full bg-card p-1"><X className="h-4 w-4" /></button>}
    </div>
  );
}

// Lista, adiciona, edita e exclui trabalhos do portfólio. Usado no cadastro e no painel.
export function PortfolioManager({ userId, view, raw, defaultCategory, onChange }: {
  userId: string;
  view: ProfessionalView["portfolio"];
  raw: RawItem[];
  defaultCategory: string | null;
  onChange: () => Promise<void>;
}) {
  const add = useServerFn(addPortfolioItem);
  const update = useServerFn(updatePortfolioItem);
  const del = useServerFn(deletePortfolioItem);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<string>(defaultCategory ?? "");
  const [photos, setPhotos] = useState<Img[]>([]);
  const [before, setBefore] = useState<Img | null>(null);
  const [after, setAfter] = useState<Img | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => { setEditing(null); setTitle(""); setDesc(""); setCat(defaultCategory ?? ""); setPhotos([]); setBefore(null); setAfter(null); };

  const startEdit = (id: string) => {
    const r = raw.find((x) => x.id === id);
    const v = view.find((x) => x.id === id);
    if (!r || !v) return;
    setEditing(id); setTitle(r.title); setDesc(r.description ?? ""); setCat(r.category_slug ?? "");
    setPhotos(r.photos.map((p, i) => ({ path: p, url: v.photos[i] ?? "" })));
    setBefore(r.before_photo ? { path: r.before_photo, url: v.before_photo ?? "" } : null);
    setAfter(r.after_photo ? { path: r.after_photo, url: v.after_photo ?? "" } : null);
  };

  const up = async (file: File | undefined) => {
    if (!file) return null;
    setUploading(true);
    try { return { path: await uploadImage(userId, file, "portfolio"), url: URL.createObjectURL(file) }; }
    catch (e) { toast.error((e as Error).message); return null; }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (title.trim().length < 2) return void toast.error("Dê um título ao trabalho.");
    if (!photos.length && !before && !after) return void toast.error("Adicione pelo menos uma foto.");
    const payload = { title, description: desc.trim() || null, category_slug: cat || null, photos: photos.map((p) => p.path), before_photo: before?.path ?? null, after_photo: after?.path ?? null };
    setBusy(true);
    try {
      if (editing) await update({ data: { ...payload, id: editing } }); else await add({ data: payload });
      toast.success(editing ? "Trabalho atualizado!" : "Trabalho adicionado!");
      reset();
      await onChange();
    } catch { toast.error("Não foi possível salvar o trabalho."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      {view.length > 0 && (
        <ul className="space-y-2">
          {view.map((i) => (
            <li key={i.id} className={`flex items-center gap-3 rounded-xl border p-2 ${editing === i.id ? "border-primary" : ""}`}>
              {(i.photos[0] ?? i.after_photo ?? i.before_photo) && <img src={i.photos[0] ?? i.after_photo ?? i.before_photo ?? ""} alt="" className="h-14 w-14 rounded-lg object-cover" />}
              <span className="flex-1 font-medium">{i.title}</span>
              <button type="button" aria-label="Editar" onClick={() => startEdit(i.id)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
              <button type="button" aria-label="Excluir" onClick={async () => { if (!confirm("Excluir este trabalho?")) return; await del({ data: { id: i.id } }); if (editing === i.id) reset(); await onChange(); }} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-4 rounded-2xl bg-muted p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{editing ? "Editar trabalho" : "Novo trabalho"}</p>
          {editing && <button type="button" onClick={reset} className="text-sm text-muted-foreground">Cancelar edição</button>}
        </div>
        <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Instalação de ventilador de teto" className={inputClass} maxLength={100} /></Field>
        <Field label="Descrição (opcional)"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className={inputClass} maxLength={600} /></Field>
        <Field label="Categoria">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputClass}>
            <option value="">Selecione</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <PhotoSlot label="Antes" value={before?.url} onPick={async (f) => { const r = await up(f); if (r) setBefore(r); }} onClear={() => setBefore(null)} />
          <PhotoSlot label="Depois" value={after?.url} onPick={async (f) => { const r = await up(f); if (r) setAfter(r); }} onClear={() => setAfter(null)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Outras fotos</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <div key={p.path} className="relative">
                <img src={p.url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button type="button" aria-label="Remover foto" onClick={() => setPhotos((x) => x.filter((y) => y.path !== p.path))} className="absolute right-1 top-1 rounded-full bg-card p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ))}
            {photos.length < 8 && (
              <PickButton onPick={async (f) => { const r = await up(f); if (r) setPhotos((x) => [...x, r]); }}>
                <span className="grid h-20 w-20 place-items-center rounded-lg border border-dashed bg-card text-muted-foreground"><ImagePlus className="h-6 w-6" /></span>
              </PickButton>
            )}
          </div>
        </div>
        <button type="button" onClick={save} disabled={busy || uploading} className="w-full rounded-xl bg-ink py-3 font-semibold text-ink-foreground disabled:opacity-60">
          {uploading ? "Enviando foto..." : busy ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar ao portfólio"}
        </button>
      </div>
    </div>
  );
}
