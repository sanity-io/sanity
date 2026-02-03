type AnyIntlOptions = Intl.DateTimeFormat | Intl.ListFormatOptions | Intl.NumberFormatOptions

/**
 * Cache of Intl.* instances. These can be costly to instantiate, but often needed,
 * thus this serves as an in-memory cache, and takes into account the options passed.
 *
 * @internal
 * @hidden
 */
export const intlCache = (() => {
  const caches = {
    dateTimeFormat: createCache<Intl.DateTimeFormat>(),
    listFormat: createCache<Intl.ListFormat>(),
    numberFormat: createCache<Intl.NumberFormat>(),
    relativeTimeFormat: createCache<Intl.RelativeTimeFormat>(),
  }

  function dateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions) {
    const key = getCacheId(locale, options)
    let instance = caches.dateTimeFormat[key]
    if (instance) {
      return instance
    }

    instance = new Intl.DateTimeFormat(locale, options)
    caches.dateTimeFormat[key] = instance
    return instance
  }

  function listFormat(locale: string, options: Intl.ListFormatOptions) {
    const key = getCacheId(locale, options)
    let instance = caches.listFormat[key]
    if (instance) {
      return instance
    }

    instance = new Intl.ListFormat(locale, options)
    caches.listFormat[key] = instance
    return instance
  }

  function numberFormat(locale: string, options: Intl.NumberFormatOptions) {
    const key = getCacheId(locale, options)
    let instance = caches.numberFormat[key]
    if (instance) {
      return instance
    }

    instance = new Intl.NumberFormat(locale, options)
    caches.numberFormat[key] = instance
    return instance
  }

  function relativeTimeFormat(locale: string, options: Intl.RelativeTimeFormatOptions) {
    const key = getCacheId(locale, options)
    let instance = caches.relativeTimeFormat[key]
    if (instance) {
      return instance
    }

    instance = new Intl.RelativeTimeFormat(locale, options)
    caches.relativeTimeFormat[key] = instance
    return instance
  }

  return {
    dateTimeFormat,
    listFormat,
    numberFormat,
    relativeTimeFormat,
  }
})()

function createCache<T>(): Record<string, T | undefined> {
  return Object.create(null)
}

function getCacheId(locale: string, options: AnyIntlOptions) {
  return `${locale}-${JSON.stringify(orderedProps(options))}`
}

function orderedProps(obj: AnyIntlOptions) {
  const segments: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    segments.push(`${key}=${JSON.stringify(value)}`)
  }
  return segments.sort().join('\n')
}
