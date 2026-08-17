/**
 * mulberry32 — tiny seeded PRNG. Every random choice in the suite goes
 * through a seeded instance so runs are reproducible: same `--seed` →
 * identical session schedules and identical bootstrap intervals (README:
 * flake resistance §3).
 */
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
