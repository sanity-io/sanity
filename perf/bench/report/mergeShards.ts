import {type BenchRunDocument} from './types'

/**
 * Merge per-shard result documents (CI runs one shard per scenario) into a
 * single report. Document-level metadata comes from the first shard;
 * scenarios concatenate; the run window spans all shards.
 *
 * Shards run on separate CI machines with different host speeds, so each
 * scenario is stamped with its own shard's `runner.calibrationMs` — the
 * document-level `runner` block (first shard's) is kept for backward
 * compatibility but doesn't describe every scenario's host.
 */
export function mergeShards(shards: BenchRunDocument[]): BenchRunDocument {
  if (shards.length === 0) {
    throw new Error('mergeShards requires at least one shard result')
  }
  const [first] = shards

  const scenarios = shards.flatMap((shard) =>
    shard.scenarios.map((scenario) => ({
      ...scenario,
      runner: {calibrationMs: shard.runner.calibrationMs},
    })),
  )

  // mode+scenario is the stored document's array `_key` (see storeShape.ts) —
  // duplicate shard inputs (e.g. an artifact downloaded twice) would produce
  // duplicate _keys and silently double every series, so fail loudly instead.
  // `mode` (not `kind`) so soak/INP reports don't collide with the plain
  // interaction/pageLoad reports in a track-main run.
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const scenario of scenarios) {
    const key = `${scenario.mode ?? scenario.kind}-${scenario.scenario}`
    if (seen.has(key)) duplicates.add(key)
    seen.add(key)
  }
  if (duplicates.size > 0) {
    throw new Error(
      `mergeShards received duplicate scenario report(s): ${[...duplicates].join(', ')} — ` +
        `the same shard result was provided more than once`,
    )
  }

  return {
    ...first,
    startedAt: shards.map((shard) => shard.startedAt).toSorted()[0],
    completedAt:
      shards
        .map((shard) => shard.completedAt)
        .toSorted()
        .at(-1) ?? first.completedAt,
    scenarios,
    // The bundle check runs identically in every shard — keep the first
    bundle: shards.find((shard) => shard.bundle)?.bundle,
  }
}
