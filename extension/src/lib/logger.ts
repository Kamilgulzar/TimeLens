// Minimal logger so issues are easy to trace in the extension console.
export const log = (...args: unknown[]): void => {
  console.log("[TimeLens]", ...args);
};

export const warn = (...args: unknown[]): void => {
  console.warn("[TimeLens]", ...args);
};