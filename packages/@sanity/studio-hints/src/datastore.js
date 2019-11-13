import {take} from 'rxjs/operators'
import settings from 'part:@sanity/base/settings'

const storageKey = 'studio-hints'
const studioHintsSettings = settings.forNamespace(storageKey)

export const isTrayOpenSetting = studioHintsSettings.forKey('isTrayOpen')
export const locationSetting = studioHintsSettings.forKey('location')

export function toggleTrayOpenState() {
  isTrayOpenSetting
    .listen(false)
    .pipe(take(1))
    .subscribe(isOpen => {
      isTrayOpenSetting.set(!isOpen)
    })
}

export function setLocation(locationObject) {
  locationSetting
    .listen()
    .pipe(take(1))
    .subscribe(isOpen => {
      locationSetting.set(JSON.stringify(locationObject))
    })
}
