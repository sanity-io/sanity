/**
 * Interaction to Next Paint (INP), computed exactly like the web-vitals
 * library from the observed per-interaction latencies (each already the max
 * duration across the events that shared one interactionId) plus the total
 * number of interactions driven.
 *
 * The rule: INP is a high percentile of the interactions, chosen by count so
 * a single slow outlier doesn't define the score on a long session. web-vitals
 * uses the (N/50)th-worst observed interaction where N is the *total*
 * interaction count (performance.interactionCount), not the observed-entry
 * count: interactions faster than the Event Timing observability floor
 * produce no entry, so indexing by observed entries would shift the
 * percentile — INP could drop when a regression pushes previously
 * below-floor interactions over the floor. Below 50 total interactions the
 * field metric is not officially reportable; we still return the worst
 * observed so short local runs get a number, and flag `reportable`.
 */
export interface InpResult {
  /** The INP value in ms (the selected high-percentile interaction). */
  inpMs: number
  /**
   * Total interactions driven, the web-vitals performance.interactionCount —
   * not the observed-entry count, which excludes below-floor interactions.
   */
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

export function computeInp(observedLatencies: number[], totalInteractionCount: number): InpResult {
  if (observedLatencies.length > totalInteractionCount) {
    // A caller counting bug, not a data condition — every observed entry
    // corresponds to a driven interaction.
    throw new Error(
      `computeInp: ${observedLatencies.length} observed latencies exceed ${totalInteractionCount} driven interactions`,
    )
  }
  if (observedLatencies.length === 0) {
    return {inpMs: 0, interactionCount: totalInteractionCount, reportable: false}
  }
  const sortedDesc = observedLatencies.toSorted((a, b) => b - a)
  // The (total/50)th-worst observed entry, clamped to the observed list —
  // index 0 (the worst) for anything under 50 total, then stepping in one
  // interaction per 50, exactly web-vitals' estimateP98LongestInteraction.
  const index = Math.min(
    Math.floor(totalInteractionCount / INP_MIN_INTERACTIONS),
    sortedDesc.length - 1,
  )
  return {
    inpMs: sortedDesc[index],
    interactionCount: totalInteractionCount,
    reportable: totalInteractionCount >= INP_MIN_INTERACTIONS,
  }
}
