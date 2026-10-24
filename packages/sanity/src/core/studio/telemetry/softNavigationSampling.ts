// Rolled once per page load, so every soft nav in a sampled session is sent.
const sessionSampleRoll = Math.random()

/** @internal */
export function isSessionSampled(sampleRate: number): boolean {
  return sessionSampleRoll < sampleRate
}
