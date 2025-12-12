export const CACHE_TAGS = {
  user: (userId: string) => `user:${userId}`,
  group: (groupId: string) => `group:${groupId}`,
  transactions: (groupId: string) => `transactions:${groupId}`,
  settlement: (groupId: string, month: string) => `settlement:${groupId}:${month}`,
  settlementAll: (groupId: string) => `settlement:${groupId}`
}

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.CI === 'true'

export const CACHE_DURATIONS: { userGroup: number | false; transactions: number | false; settlement: number | false } = {
  userGroup: isTestEnv ? false : 300,
  transactions: isTestEnv ? false : 60,
  settlement: isTestEnv ? false : 600
}
