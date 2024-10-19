import {supportsLocalStorage} from '../util/supportsLocalStorage'

const AUTO_CONFIRM_KEY = 'sanityStudio:start-in-create:auto-confirm'

export function isStartInCreateAutoConfirmed(): boolean {
  if (!supportsLocalStorage) {
    return false
  }
  return localStorage.getItem(AUTO_CONFIRM_KEY) === 'true'
}

export function setStartInCreateAutoConfirm(enabled: boolean): void {
  if (!supportsLocalStorage) {
    return
  }
  localStorage.setItem(AUTO_CONFIRM_KEY, `${enabled}`)
}
