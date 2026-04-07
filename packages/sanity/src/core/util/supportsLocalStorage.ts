/**
 * Whether or not the current environment supports localStorage.
 * Checks that values can actually be set/removed, to trigger any privacy settings.
 *
 * @internal
 */
export const supportsLocalStorage = (() => {
  // Non-browser runtimes (Node.js 22+, Bun, Deno) may expose a built-in
  // `localStorage` global that either warns or behaves differently from the
  // browser implementation. Since this utility is only useful in real browsers,
  // bail out in non-browser environments — even if browser globals have been
  // mocked (e.g., jsdom in CLI commands/tests). `process.versions` is set by
  // all major server-side runtimes and is not faked by jsdom.
  // Note that `process.versions` may also be defined by frameworks.
  // E.g. Next.js/Turbopack polyfills it and sets it to an empty object
  if (
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node !== 'undefined'
  ) {
    return false
  }

  const key = '__tmp_supports_local_storage'

  try {
    if (typeof localStorage === 'undefined') {
      return false
    }

    localStorage.setItem(key, '---')
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
})()
