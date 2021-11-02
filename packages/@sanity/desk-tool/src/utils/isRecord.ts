export const isRecord = (thing: unknown): thing is Record<string, unknown> =>
  !!thing && typeof thing === 'object' && !Array.isArray(thing)
