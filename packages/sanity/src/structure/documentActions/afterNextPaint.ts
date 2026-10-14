import {Observable} from 'rxjs'

/**
 * Emits (and completes) once the page has had the chance to paint what is currently committed to
 * the DOM, for work that is about to block the main thread and should not hold back what was
 * rendered just before it. A task queued from a `requestAnimationFrame` callback runs after that
 * frame has been painted; it is queued through a `MessageChannel` rather than a timer so that it
 * is not subject to timer throttling. A hidden page paints nothing and gets no frames, so there
 * it emits right away, also when it gets hidden while waiting for the frame.
 *
 * @internal
 */
export function afterNextPaint(): Observable<void> {
  return new Observable<void>((subscriber) => {
    if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') {
      subscriber.next()
      subscriber.complete()
      return undefined
    }

    let frame: number | undefined
    let channel: MessageChannel | undefined
    const emit = () => {
      subscriber.next()
      subscriber.complete()
    }
    const emitInTask = () => {
      channel = new MessageChannel()
      channel.port1.onmessage = emit
      channel.port2.postMessage(undefined)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden' || frame === undefined) return
      cancelAnimationFrame(frame)
      frame = undefined
      emit()
    }

    if (document.visibilityState === 'hidden') {
      emit()
      return undefined
    }
    frame = requestAnimationFrame(() => {
      frame = undefined
      emitInTask()
    })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (frame !== undefined) cancelAnimationFrame(frame)
      if (channel) {
        channel.port1.onmessage = null
        channel.port1.close()
      }
    }
  })
}
