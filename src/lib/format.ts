/** Up to 2 decimals, no trailing zeros: 102.5, 1.25, 220. */
export const fmt = (n: number) => String(Math.round(n * 100) / 100);

/** Up to 1 decimal: 99.8, 220.5. */
export const fmt1 = (n: number) => String(Math.round(n * 10) / 10);

/** Signed difference with a real minus sign: "+0.3", "−0.2". */
export const fmtDiff = (n: number) =>
  (Math.round(n * 10) / 10 >= 0 ? "+" : "−") + fmt1(Math.abs(n));
