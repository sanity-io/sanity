import {type BenchRunDocument} from './types'

/**
 * Merge per-shard result documents (CI runs one shard per scenario) into a
 * single report. Metadata comes from the first shard; scenarios concatenate;
 * the run window spans all shards.
 */
export function mergeShards(shards: BenchRunDocument[]): BenchRunDocument {
  if (shards.length === 0) {
    throw new Error('mergeShards requires at least one shard result')
  }
  const [first] = shards
  return {
    ...first,
    startedAt: shards.map((shard) => shard.startedAt).toSorted()[0],
    completedAt:
      shards
        .map((shard) => shard.completedAt)
        .toSorted()
        .at(-1) ?? first.completedAt,
    scenarios: shards.flatMap((shard) => shard.scenarios),
    // The bundle check runs identically in every shard — keep the first
    bundle: shards.find((shard) => shard.bundle)?.bundle,
  }
}
