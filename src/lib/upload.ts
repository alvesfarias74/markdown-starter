import { supabase } from "@/integrations/supabase/client";

const MAX = 8 * 1024 * 1024;

// Envia uma imagem para a pasta do usuário no storage e devolve o caminho salvo.
export async function uploadImage(userId: string, file: File, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error("Envie apenas imagens.");
  if (file.size > MAX) throw new Error("A imagem deve ter no máximo 8 MB.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("professional-media").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Não foi possível enviar a imagem.");
  return path;
}
