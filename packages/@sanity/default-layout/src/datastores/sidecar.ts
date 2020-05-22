import {take} from 'rxjs/operators'
import settings from 'part:@sanity/base/settings'

const storageKey = 'sidecar'
const sidecarSettings = settings.forNamespace(storageKey)

// Listen to this to determine if the sidecar is open or closed
export const isSidecarOpenSetting = sidecarSettings.forKey('isSidecarOpen')

// Call this to flip sidecar state
export function toggleSidecarOpenState() {
  isSidecarOpenSetting
    .listen()
    .pipe(take(1))
    .subscribe(isOpen => {
      const newState = !isOpen
      isSidecarOpenSetting.set(newState)
    })
}
