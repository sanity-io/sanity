import {take} from 'rxjs/operators'
import settings from 'part:@sanity/base/settings'

const storageKey = 'sidecar'
const sidecarSettings = settings.forNamespace(storageKey)

export const isSidecarOpenSetting = sidecarSettings.forKey('isSidecarOpen')

export function toggleSidecarOpenState() {
  isSidecarOpenSetting
    .listen()
    .pipe(take(1))
    .subscribe(isOpen => {
      const newState = !isOpen
      isSidecarOpenSetting.set(newState)
    })
}
