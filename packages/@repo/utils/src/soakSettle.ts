/**
 * Where a bench soak run reaches steady state: the first minutes race the
 * studio's lazy mount, so growth is read from the settle minute on. dev/radar
 * uses the default for runs stored before perf/bench recorded the minute.
 * Browser-safe.
 */

export const DEFAULT_SOAK_SETTLE_MINUTE = 2

/**
 * The settle minute for a soak of `minutes`, clamped so at least two samples
 * (the settle minute and the final one) remain for a slope.
 */
export function soakSettleMinute(
  minutes: number,
  requested: number = DEFAULT_SOAK_SETTLE_MINUTE,
): number {
  return Math.max(0, Math.min(requested, minutes - 1))
}

/** The samples a steady-state growth figure is computed from. */
export function steadySoakSamples<Sample extends {minute: number}>(
  samples: Sample[],
  settleMinute: number,
): Sample[] {
  return samples.filter((sample) => sample.minute >= settleMinute)
}
