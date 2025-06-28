import {type StudioColorScheme} from '../theme/types'

function getScheme(scheme: unknown): StudioColorScheme {
  switch (scheme) {
    case 'dark':
    case 'light':
      return scheme
    default:
      return 'system'
  }
}

/** @internal */
export const LOCAL_STORAGE_KEY = 'sanityStudio:ui:colorScheme'

let snapshot: StudioColorScheme
const subscribers = new Set<() => void>()

/** @internal */
export const subscribe = (onStoreChange: () => void) => {
  if (!snapshot) {
    snapshot = getScheme(localStorage.getItem(LOCAL_STORAGE_KEY)) || 'system'
  }
  subscribers.add(onStoreChange)
  return (): void => {
    subscribers.delete(onStoreChange)
  }
}
/** @internal */
export function getSnapshot(): StudioColorScheme {
  return snapshot
}
/** @internal */
export function setSnapshot(nextScheme: StudioColorScheme): void {
  snapshot = getScheme(nextScheme)
  for (const subscription of subscribers) {
    subscription()
  }
}
