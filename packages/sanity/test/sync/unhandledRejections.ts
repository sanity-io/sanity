export interface UnhandledRejections {
  reasons: unknown[]
  stop: () => void
}

// Vitest's own listener fails the whole file, so it is set aside while a test records them instead.
export function captureUnhandledRejections(): UnhandledRejections {
  const reasons: unknown[] = []
  const previous = process.listeners('unhandledRejection')
  function record(reason: unknown): void {
    reasons.push(reason)
  }
  function stop(): void {
    process.off('unhandledRejection', record)
    previous.forEach((listener) => process.on('unhandledRejection', listener))
  }
  process.removeAllListeners('unhandledRejection')
  process.on('unhandledRejection', record)
  return {reasons, stop}
}
