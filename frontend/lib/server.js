const base = process.env.API_PROXY_URL || 'http://localhost:4000';

export async function serverApi(path) {
  try {
    const response = await fetch(`${base}${path}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
