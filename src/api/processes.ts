import type { ProcessRoute } from '../data/routes';

export async function fetchProcessRoutes(): Promise<ProcessRoute[]> {
  const res = await fetch('/api/processes');
  if (!res.ok) throw new Error(`Failed to fetch process routes: ${res.statusText}`);
  return res.json() as Promise<ProcessRoute[]>;
}

export async function searchProcessRoutes(query: string): Promise<ProcessRoute[]> {
  const res = await fetch(`/api/processes/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Failed to search process routes: ${res.statusText}`);
  return res.json() as Promise<ProcessRoute[]>;
}

export async function fetchRecommendedRoutes(metal: string, oreType: string): Promise<ProcessRoute[]> {
  const params = new URLSearchParams({ metal, oreType });
  const res = await fetch(`/api/processes/recommend?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch recommended routes: ${res.statusText}`);
  return res.json() as Promise<ProcessRoute[]>;
}
