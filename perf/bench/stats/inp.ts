/**
 * Interaction to Next Paint (INP), computed exactly like the web-vitals
 * library from a set of per-interaction latencies (each already the max
 * duration across the events that shared one interactionId).
 *
 * The rule: INP is a high percentile of the interactions, chosen by count so
 * a single slow outlier doesn't define the score on a long session. web-vitals
 * uses the (N/50)th-worst interaction — the 75th percentile at 50 interactions,
 * ~98th at fewer — after collapsing to the worst per interaction. Below 50
 * interactions the field metric is not officially reportable; we still return
 * the worst so short local runs get a number, and flag `reportable`.
 */
export interface InpResult {
  /** The INP value in ms (the selected high-percentile interaction). */
  inpMs: number
  /** How many distinct interactions were observed. */
  interactionCount: number
  /**
   * True once enough interactions accumulated for the percentile rule to be
   * meaningful (web-vitals' own >= 50 threshold before it deviates from "the
   * worst interaction"). Below this the number is the max, not a percentile.
   */
  reportable: boolean
}

/** web-vitals' threshold before the percentile rule kicks in. */
export const INP_MIN_INTERACTIONS = 50

export function computeInp(interactionLatencies: number[]): InpResult {
  const count = interactionLatencies.length
  if (count === 0) {
    return {inpMs: 0, interactionCount: 0, reportable: false}
  }
  const sortedDesc = interactionLatencies.toSorted((a, b) => b - a)
  // The (N/50)th-worst interaction, clamped to the array — index 0 (the worst)
  // for anything under 50, then stepping in one interaction per 50.
  const index = Math.min(Math.floor(count / INP_MIN_INTERACTIONS), sortedDesc.length - 1)
  return {
    inpMs: sortedDesc[index],
    interactionCount: count,
    reportable: count >= INP_MIN_INTERACTIONS,
  }
}
