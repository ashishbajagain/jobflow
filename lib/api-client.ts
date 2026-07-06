/** Client-side fetch that always sends session cookies. */
export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, { credentials: 'same-origin', ...init });
}
