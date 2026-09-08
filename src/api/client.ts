import { useSyncSettingsStore } from '@/src/sync/syncSettingsStore';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const { apiBaseUrl, apiToken } = useSyncSettingsStore.getState();
  if (!apiBaseUrl || !apiToken) {
    throw new Error('URL API & token belum diatur di Pengaturan > Sinkronisasi.');
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiToken}`,
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Gak ada koneksi ke server.');
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
    throw new Error(message);
  }

  return response.json();
}
