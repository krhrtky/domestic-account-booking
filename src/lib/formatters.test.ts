import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatPercentage } from './formatters';

describe('L-CX-002: UI表示の一貫性', () => {
  describe('formatCurrency', () => {
    it('正の金額は円記号と3桁区切りで表示', () => {
      expect(formatCurrency(10000)).toBe('¥10,000');
      expect(formatCurrency(1234567)).toBe('¥1,234,567');
    });

    it('負の金額はマイナス記号を先頭に', () => {
      expect(formatCurrency(-5000)).toBe('-¥5,000');
    });

    it('0は ¥0 と表示', () => {
      expect(formatCurrency(0)).toBe('¥0');
    });

    it('小数点以下は扱わない (整数のみ)', () => {
      expect(formatCurrency(1234)).toBe('¥1,234');
      expect(formatCurrency(1)).toBe('¥1');
    });
  });

  describe('formatDate', () => {
    it('標準形式 (long) で表示', () => {
      expect(formatDate(new Date('2025-01-15'))).toBe('2025年1月15日');
      expect(formatDate('2025-12-31')).toBe('2025年12月31日');
    });

    it('短縮形式 (short) で表示', () => {
      expect(formatDate(new Date('2025-01-15'), 'short')).toBe('2025/01/15');
      expect(formatDate('2025-09-01', 'short')).toBe('2025/09/01');
    });

    it('一桁の月日はゼロパディング (short)', () => {
      expect(formatDate(new Date('2025-01-05'), 'short')).toBe('2025/01/05');
    });

    it('一桁の月は数値のまま (long)', () => {
      expect(formatDate(new Date('2025-01-05'), 'long')).toBe('2025年1月5日');
    });
  });

  describe('formatPercentage', () => {
    it('パーセント記号付きで表示', () => {
      expect(formatPercentage(60)).toBe('60%');
      expect(formatPercentage(100)).toBe('100%');
      expect(formatPercentage(0)).toBe('0%');
    });

    it('小数でも対応', () => {
      expect(formatPercentage(33.3)).toBe('33.3%');
    });
  });
});
