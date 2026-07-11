import { describe, it, expect } from 'vitest';
import { CURRENCIES, symbolOf, formatMoney } from './currencies';

describe('currency catalogue', () => {
  it('offers USD/EUR/GBP/INR/JPY at minimum, USD first', () => {
    const codes = CURRENCIES.map(c => c.code);
    expect(codes[0]).toBe('USD');
    ['USD', 'EUR', 'GBP', 'INR', 'JPY'].forEach(c => expect(codes).toContain(c));
  });
});

describe('symbolOf', () => {
  it('maps known codes to symbols', () => {
    expect(symbolOf('USD')).toBe('$');
    expect(symbolOf('EUR')).toBe('€');
    expect(symbolOf('GBP')).toBe('£');
    expect(symbolOf('INR')).toBe('₹');
    expect(symbolOf('JPY')).toBe('¥');
  });
  it('falls back to $ for unknown/missing codes (legacy saves)', () => {
    expect(symbolOf(undefined)).toBe('$');
    expect(symbolOf('ZZZ')).toBe('$');
  });
});

describe('formatMoney', () => {
  it('prefixes the symbol and groups thousands', () => {
    expect(formatMoney(3000, 'EUR')).toBe('€3,000');
    expect(formatMoney(1000000, 'GBP')).toBe('£1,000,000');
  });
  it('defaults currency to USD when absent', () => {
    expect(formatMoney(1500, undefined)).toBe('$1,500');
  });
  it('honours fractionDigits (expense list keeps 2 decimals)', () => {
    expect(formatMoney(1234.5, 'USD', { fractionDigits: 2 })).toBe('$1,234.50');
  });
});
