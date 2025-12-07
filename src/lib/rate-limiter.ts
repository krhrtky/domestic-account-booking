type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

const getStore = (storeName: string): Map<string, RateLimitEntry> => {
  if (!stores.has(storeName)) {
    stores.set(storeName, new Map())
  }
  return stores.get(storeName)!
}

export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig,
  storeName = 'default'
): { allowed: true } | { allowed: false; retryAfter: number } => {
  const store = getStore(storeName)
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt <= now) {
    store.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return { allowed: true }
  }

  if (entry.count >= config.maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true }
}

export const resetRateLimit = (
  identifier: string,
  storeName = 'default'
): void => {
  const store = stores.get(storeName)
  if (store) {
    store.delete(identifier)
  }
}

export const clearAllRateLimits = (): void => {
  stores.clear()
}
