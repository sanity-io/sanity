const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193
const UINT32_RANGE = 2 ** 32

function hashToUnitInterval(value: string): number {
  const hash = Array.from(value).reduce(
    (current, character) => Math.imul(current ^ character.charCodeAt(0), FNV_PRIME),
    FNV_OFFSET_BASIS,
  )
  return (hash >>> 0) / UINT32_RANGE
}

/**
 * Decides once per session, from its id, so every soft nav in a sampled session is sent.
 *
 * @internal
 */
export function isSessionSampled(sessionId: string, sampleRate: number): boolean {
  return hashToUnitInterval(sessionId) < sampleRate
}
