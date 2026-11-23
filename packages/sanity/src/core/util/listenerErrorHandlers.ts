/**
 * Takes over a listener that failed in a way it cannot recover from, as the studio's error handler
 * does: it shows the connection error dialog and never settles, or rejects to pass the error on.
 *
 * @internal
 */
export interface ListenerErrorHandler {
  handle(err: unknown): Promise<never>
}

const handlers = new Set<ListenerErrorHandler>()

/**
 * Makes `handler` take over the listeners that fail irrecoverably (see `reconnectListener`), until
 * the returned function is called.
 *
 * Listeners look the handlers up when they fail, not when they are created, so every listener is
 * covered wherever it was set up: a document pair is shared by every consumer of the document, and
 * whichever of them happens to open its listener first cannot be relied on to pass a handler along.
 * A listener that fails irrecoverably is down for everything that uses it, so every registered
 * handler takes it over: each mounted studio shows the connection error dialog.
 *
 * @internal
 */
export function registerListenerErrorHandler(handler: ListenerErrorHandler): () => void {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

/**
 * The handler that takes over the failed listeners, if any is registered: it hands the error to
 * every handler registered at the time, and rejects with the error once all of them have rejected.
 *
 * @internal
 */
export function registeredListenerErrorHandler(): ListenerErrorHandler | undefined {
  if (handlers.size === 0) return undefined
  const current = [...handlers]
  return {
    async handle(failure) {
      try {
        return await Promise.any(current.map((handler) => handler.handle(failure)))
      } catch {
        throw failure
      }
    },
  }
}
