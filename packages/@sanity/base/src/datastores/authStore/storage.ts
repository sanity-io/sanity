const supportsLocalStorage = (() => {
  const key = '__tmp_supports_local_storage'

  try {
    if (typeof localStorage === 'undefined') {
      return false
    }

    localStorage.setItem(key, '---')
    localStorage.removeItem(key)
    return true
  } catch (err) {
    return false
  }
})()

const memStore: Record<string, string> = {}

export function setItem(key: string, value: string): void {
  if (supportsLocalStorage) {
    localStorage[key] = value
  } else {
    memStore[key] = value
  }
}

export function getItem(key: string): string | undefined {
  return supportsLocalStorage ? localStorage[key] : memStore[key]
}

export function removeItem(key: string): void {
  if (supportsLocalStorage) {
    localStorage.removeItem(key)
  } else {
    delete memStore[key]
  }
}
