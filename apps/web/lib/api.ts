import { clearToken, getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Sertakan header Authorization (default true). */
  auth?: boolean;
  /** Redirect ke /login saat dapat 401 (default true). Set false untuk endpoint login/register. */
  redirectOn401?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, redirectOn401 = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && redirectOn401 && typeof window !== 'undefined') {
    clearToken();
    // Helper ini berada di luar komponen React; hard redirect disengaja agar
    // seluruh state aplikasi ikut di-reset saat sesi berakhir.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/login');
    throw new ApiError(401, 'Sesi berakhir, silakan login kembali.');
  }

  if (!res.ok) {
    let message = `Request gagal (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
      ) {
        message = (data as { message: string }).message;
      }
    } catch {
      // respons bukan JSON — pakai pesan default
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
