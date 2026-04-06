const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
export async function apiFetch(path, init = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
        ...init
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || 'Request failed');
    return data;
}
