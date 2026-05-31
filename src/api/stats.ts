export interface AppStats {
  minerals: number;
  processRoutes: number;
  suppliers: number;
  metals: number;
}

export async function fetchStats(): Promise<AppStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json() as Promise<AppStats>;
}
