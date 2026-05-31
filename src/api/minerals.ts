import type { MineralData } from '../data/minerals';

export async function fetchMinerals(): Promise<MineralData[]> {
  const res = await fetch('/api/minerals');
  if (!res.ok) throw new Error(`Failed to fetch minerals: ${res.statusText}`);
  return res.json() as Promise<MineralData[]>;
}

export async function searchMinerals(query: string): Promise<MineralData[]> {
  const res = await fetch(`/api/minerals/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Failed to search minerals: ${res.statusText}`);
  return res.json() as Promise<MineralData[]>;
}
