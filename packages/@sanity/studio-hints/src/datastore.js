import {take} from 'rxjs/operators'
import settings from 'part:@sanity/base/settings'

const storageKey = 'studio-hints'
const studioHintsSettings = settings.forNamespace(storageKey)

export const isTrayOpenSetting = studioHintsSettings.forKey('isTrayOpen')
export const locationSetting = studioHintsSettings.forKey('location')

export function toggleTrayOpenState() {
  isTrayOpenSetting
    .listen()
    .pipe(take(1))
    .subscribe(isOpen => {
      const newState = !isOpen
      isTrayOpenSetting.set(newState)
    })
}

// The shape of locationObject is
// {type: 'hint', id: '123lkhlkh-234kwe3-45'} || null
// It's only set if the user has "drilled down" to a specific object
export function updateLocation(locationObject) {
  locationSetting.set(locationObject ? JSON.stringify(locationObject) : undefined)
}
