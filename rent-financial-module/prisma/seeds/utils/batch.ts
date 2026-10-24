export function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }
  return batches;
}

export function required(map: ReadonlyMap<string, string>, key: string, label: string): string {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`No se encontró el id de ${label} "${key}"`);
  }
  return value;
}
