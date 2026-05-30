import type { Supplier } from '../data/suppliers';

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch('/api/suppliers');
  if (!res.ok) throw new Error(`Failed to fetch suppliers: ${res.statusText}`);
  return res.json() as Promise<Supplier[]>;
}
