/**
 * Whether or not the current environment supports localStorage.
 * Checks that values can actually be set/removed, to trigger any privacy settings.
 *
 * @internal
 */
export const supportsLocalStorage = (() => {
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
