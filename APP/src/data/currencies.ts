/** Finance-side display currencies (item 2). Symbol relabel only — no FX conversion.
 *  The stored amounts never change; only the symbol shown to the player does. Game Gold
 *  is a separate in-game currency and is NOT affected. */
export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'Australian Dollar' },
];

const SYMBOLS: Record<string, string> = Object.fromEntries(CURRENCIES.map(c => [c.code, c.symbol]));

export const symbolOf = (code?: string): string => (code && SYMBOLS[code]) || '$';

/** Format a finance amount for display: prefixed symbol + grouped number. */
export const formatMoney = (
  amount: number,
  code?: string,
  opts?: { fractionDigits?: number },
): string => {
  const n =
    opts?.fractionDigits != null
      ? amount.toLocaleString(undefined, {
          minimumFractionDigits: opts.fractionDigits,
          maximumFractionDigits: opts.fractionDigits,
        })
      : amount.toLocaleString();
  return `${symbolOf(code)}${n}`;
};
