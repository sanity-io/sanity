import {type StudioThemeColorSchemeKey} from '../theme/types'

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
function getScheme(scheme: unknown): StudioThemeColorSchemeKey {
  switch (scheme) {
    case 'dark':
    case 'light':
      return scheme
    default:
      return 'system'
  }
}

/** @internal */
const LOCAL_STORAGE_KEY = 'sanityStudio:ui:colorScheme'

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
let snapshot: StudioThemeColorSchemeKey
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
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function getSnapshot(): StudioThemeColorSchemeKey {
  return snapshot
}
/** @internal */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function setSnapshot(nextScheme: StudioThemeColorSchemeKey): void {
  snapshot = getScheme(nextScheme)
  for (const subscription of subscribers) {
    subscription()
  }
}
