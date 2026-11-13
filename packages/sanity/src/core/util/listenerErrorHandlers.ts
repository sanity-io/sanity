/**
 * Takes over a listener that failed in a way it cannot recover from, as the studio's error handler
 * does: it shows the connection error dialog and never settles, or rejects to pass the error on.
 *
 * @internal
 */
export interface ListenerErrorHandler {
  handle(err: unknown): Promise<never>
}

const handlersByProject = new Map<string, ListenerErrorHandler[]>()

/**
 * Makes `handler` take over the listeners of `projectId` that fail for good (see
 * `reconnectListener`), until the returned function is called.
 *
 * Listeners look their handler up by project when they fail, not when they are created, so every
 * listener of the project is covered wherever it was set up: a document pair is shared by every
 * consumer of the document, and whichever of them happens to open its listener first cannot be
 * relied on to pass a handler along. The latest registration for a project wins, and removing it
 * hands the project back to the one before it.
 *
 * @internal
 */
export function registerListenerErrorHandler(
  projectId: string,
  handler: ListenerErrorHandler,
): () => void {
  const handlers = handlersByProject.get(projectId) ?? []
  handlersByProject.set(projectId, [...handlers, handler])
  return () => {
    const remaining = (handlersByProject.get(projectId) ?? []).filter(
      (candidate) => candidate !== handler,
    )
    if (remaining.length > 0) handlersByProject.set(projectId, remaining)
    else handlersByProject.delete(projectId)
  }
}

/**
 * The handler that takes over the failed listeners of `projectId`, if one is registered.
 *
 * @internal
 */
export function listenerErrorHandlerForProject(
  projectId: string,
): ListenerErrorHandler | undefined {
  return handlersByProject.get(projectId)?.at(-1)
}
