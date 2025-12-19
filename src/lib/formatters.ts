export function formatCurrency(amount: number): string {
  if (amount < 0) {
    const absAmount = Math.abs(amount);
    return `-¥${absAmount.toLocaleString('ja-JP')}`;
  }
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export function formatDate(date: Date | string, format: 'long' | 'short' = 'long'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if (format === 'short') {
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    return `${year}/${paddedMonth}/${paddedDay}`;
  }

  return `${year}年${month}月${day}日`;
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}
