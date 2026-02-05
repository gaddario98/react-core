type ExtractorCache<T> = Map<string, T>;

const EMPTY_OBJECT = {};
function createExtractor<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(allData?: T, cache?: ExtractorCache<Partial<T>>, usedKeys?: Array<K>): T {
  if (!allData || !cache) return EMPTY_OBJECT as T;
  const keys = usedKeys ?? (Object.keys(allData) as Array<K>);

  const key = JSON.stringify(keys);
  const previous = cache.get(key);

  const extracted = Object.fromEntries(
    Object.entries(allData).filter(([k]) => keys.includes(k as K))
  ) as T;

  if (!previous || JSON.stringify(previous) !== JSON.stringify(extracted)) {
    cache.set(key, extracted);
  }

  return (cache.get(key) || extracted) as T;
}
export { type ExtractorCache, createExtractor };
