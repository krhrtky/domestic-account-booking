export const CACHE_TAGS = {
  user: (userId: string) => `user:${userId}`,
  group: (groupId: string) => `group:${groupId}`,
  transactions: (groupId: string) => `transactions:${groupId}`,
  settlement: (groupId: string, month: string) => `settlement:${groupId}:${month}`,
  settlementAll: (groupId: string) => `settlement:${groupId}`
}

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.CI === 'true'

export const CACHE_DURATIONS = {
  userGroup: isTestEnv ? 0 : 300,
  transactions: isTestEnv ? 0 : 60,
  settlement: isTestEnv ? 0 : 600
}
