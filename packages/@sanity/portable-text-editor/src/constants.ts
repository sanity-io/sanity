/**
 * Debounce time for flushing local patches (ms since user haven't produced a patch)
 * (lower time for tests to speed them up)
 */
export const FLUSH_PATCHES_DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 100 : 1000
