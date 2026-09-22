import { useSyncSettingsStore } from '@/src/sync/syncSettingsStore';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * fetch() bawaan Expo (SDK 57) TIDAK bisa mengirim FormData yang berisi bagian
 * bentuk `{uri, name, type}` (cara resmi RN attach file lokal ke FormData) -
 * gagal dgn "Unsupported FormDataPart implementation" walau bentuk itu didukung
 * FormData.append()-nya sendiri (lihat convertFormDataAsync di paket expo, cuma
 * menangani string/Blob, gak ada cabang utk `uri`). Jadi khusus request FormData
 * (upload gambar produk), pakai XMLHttpRequest yg tetap pakai jalur native RN asli
 * (mendukung `{uri, name, type}` sejak awal, gak lewat fetch polyfill Expo).
 */
function xhrRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: FormData
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.send(body);
  });
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const { apiBaseUrl, apiToken } = useSyncSettingsStore.getState();
  if (!apiBaseUrl || !apiToken) {
    throw new Error('URL API & token belum diatur di Pengaturan > Sinkronisasi.');
  }

  const isFormData = options.body instanceof FormData;
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api${path}`;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
    Authorization: `Bearer ${apiToken}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  let status: number;
  let text: string;
  try {
    if (isFormData) {
      const result = await xhrRequest(url, options.method ?? 'GET', headers, options.body as FormData);
      status = result.status;
      text = result.text;
    } else {
      const response = await fetch(url, { ...options, headers });
      status = response.status;
      text = await response.text();
    }
  } catch (error) {
    // "Network request failed" itu generik - bisa berarti beneran offline, TAPI
    // juga bisa gagal baca file lokal (mis. gambar dari FormData sudah gak ada/gak
    // kebaca). Sertakan pesan asli biar kelihatan bedanya, jangan ditutup jadi 1 kalimat.
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Gak ada koneksi ke server (${detail}).`);
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // bukan JSON, biarkan parsed null - fallback ke pesan mentah di bawah
  }

  if (status < 200 || status >= 300) {
    const firstError = parsed?.errors ? Object.values(parsed.errors).flat()[0] : null;
    const message = (firstError as string | undefined) ?? parsed?.message ?? `API error ${status}: ${text.slice(0, 200)}`;
    throw new ApiError(message, status);
  }

  return parsed;
}
