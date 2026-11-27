import {type BaseSyntheticEvent, type ClipboardEvent as ReactClipboardEvent} from 'react'

export function createEventLike<T>(
  type: string,
  nativeEvent: T,
): BaseSyntheticEvent<T, EventTarget | null, EventTarget | null> {
  let defaultPrevented = false
  let propagationStopped = false

  return {
    bubbles: false,
    cancelable: true,
    currentTarget: null,
    get defaultPrevented() {
      return defaultPrevented
    },
    eventPhase: 0,
    isDefaultPrevented: () => defaultPrevented,
    isPropagationStopped: () => propagationStopped,
    isTrusted: false,
    nativeEvent,
    persist: () => undefined,
    preventDefault: () => {
      defaultPrevented = true
    },
    stopPropagation: () => {
      propagationStopped = true
    },
    target: null,
    timeStamp: Date.now(),
    type,
  }
}

// The legacy React type requires a cast: Behavior data has no DOM targets.
// The nativeEvent below is newly constructed, never the original browser event.
export function createClipboardEventLike(
  type: 'copy' | 'paste',
  clipboardData: DataTransfer,
): ReactClipboardEvent<HTMLDivElement | HTMLSpanElement> {
  const nativeEvent = new ClipboardEvent(type, {clipboardData})
  // Firefox ignores the `clipboardData` init member and gives the event an empty DataTransfer
  Object.defineProperty(nativeEvent, 'clipboardData', {value: clipboardData})
  return Object.assign(createEventLike(type, nativeEvent), {
    clipboardData,
  }) as ReactClipboardEvent<HTMLDivElement | HTMLSpanElement>
}
