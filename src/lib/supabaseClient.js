import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function uploadAvatar(userId, file) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };

  const maxSize = 512;
  let processedFile = file;

  if (file.size > 2 * 1024 * 1024) {
    return { data: null, error: new Error('Image too large. Max 2MB.') };
  }

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = objectUrl;
  });
  URL.revokeObjectURL(objectUrl);

  if (img.width > maxSize || img.height > maxSize) {
    const canvas = document.createElement('canvas');
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    processedFile = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to resize image'));
      }, 'image/jpeg', 0.9);
    });
  }

  const fileName = `${userId}/${crypto.randomUUID()}.jpg`;
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, processedFile, { upsert: false });

  if (error) return { data: null, error };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return { data: { path: data.path, url: publicUrl }, error: null };
}
