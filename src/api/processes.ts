import type { ProcessRoute } from '../data/routes';

export async function fetchProcessRoutes(): Promise<ProcessRoute[]> {
  const res = await fetch('/api/processes');
  if (!res.ok) throw new Error(`Failed to fetch process routes: ${res.statusText}`);
  return res.json() as Promise<ProcessRoute[]>;
}
