import { unstable_cache } from 'next/cache'

export const CACHE_TAGS = {
  user: (userId: string) => `user:${userId}`,
  group: (groupId: string) => `group:${groupId}`,
  transactions: (groupId: string) => `transactions:${groupId}`,
  settlement: (groupId: string, month: string) => `settlement:${groupId}:${month}`,
  settlementAll: (groupId: string) => `settlement:${groupId}`
}

export const isTestEnv = () =>
  process.env.NODE_ENV === 'test' ||
  process.env.CI === 'true' ||
  process.env.E2E_TEST === 'true'

export const getCacheDuration = (type: 'userGroup' | 'transactions' | 'settlement'): number | false => {
  if (isTestEnv()) return false
  const durations = { userGroup: 300, transactions: 60, settlement: 600 }
  return durations[type]
}

export const CACHE_DURATIONS: { userGroup: number | false; transactions: number | false; settlement: number | false } = {
  get userGroup() { return getCacheDuration('userGroup') },
  get transactions() { return getCacheDuration('transactions') },
  get settlement() { return getCacheDuration('settlement') }
}

export function cachedFetch<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] }
): Promise<T> {
  if (isTestEnv()) {
    return fn()
  }
  return unstable_cache(fn, keyParts, options)()
}
