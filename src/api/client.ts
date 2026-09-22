import { useSyncSettingsStore } from '@/src/sync/syncSettingsStore';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const { apiBaseUrl, apiToken } = useSyncSettingsStore.getState();
  if (!apiBaseUrl || !apiToken) {
    throw new Error('URL API & token belum diatur di Pengaturan > Sinkronisasi.');
  }

  const isFormData = options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        Authorization: `Bearer ${apiToken}`,
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    // "Network request failed" React Native itu generik - bisa berarti beneran offline,
    // TAPI juga bisa gagal baca file lokal (mis. gambar dari FormData sudah gak ada/gak
    // kebaca). Sertakan pesan asli biar kelihatan bedanya, jangan ditutup jadi 1 kalimat.
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Gak ada koneksi ke server (${detail}).`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // bukan JSON, biarkan parsed null - fallback ke pesan mentah di bawah
    }

    const firstError = parsed?.errors ? Object.values(parsed.errors).flat()[0] : null;
    const message = (firstError as string | undefined) ?? parsed?.message ?? `API error ${response.status}: ${text.slice(0, 200)}`;
    throw new ApiError(message, response.status);
  }

  return response.json();
}
