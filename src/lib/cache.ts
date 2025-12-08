export const CACHE_TAGS = {
  user: (userId: string) => `user:${userId}`,
  group: (groupId: string) => `group:${groupId}`,
  transactions: (groupId: string) => `transactions:${groupId}`,
  settlement: (groupId: string, month: string) => `settlement:${groupId}:${month}`,
  settlementAll: (groupId: string) => `settlement:${groupId}`
}

export const CACHE_DURATIONS = {
  userGroup: 300,
  transactions: 60,
  settlement: 600
}
