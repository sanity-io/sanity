const noop = () => {
  /* intentional noop */
}

let isSupported = null
const supportsLocalStorage = () => {
  if (isSupported !== null) {
    return isSupported
  }

  const testKey = '__test__'
  try {
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    isSupported = true
  } catch (evt) {
    isSupported = false
  }

  return isSupported
}

const tryParse = (val, defValue) => {
  try {
    return JSON.parse(val)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse settings: ${err.message}`)
    return defValue
  }
}

const del = (ns, key) => {
  localStorage.removeItem(`${ns}::${key}`)
}

const get = (ns, key, defValue) => {
  const val = localStorage.getItem(`${ns}::${key}`)
  return val === null ? defValue : tryParse(val, defValue)
}

const set = (ns, key, val) => {
  // Can't stringify undefined, and nulls are what
  // `getItem` returns when key does not exist
  if (typeof val === 'undefined' || val === null) {
    del(ns, key)
  } else {
    localStorage.setItem(`${ns}::${key}`, JSON.stringify(val))
  }
}

const clear = ns => {
  const prefix = `${ns}::`
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith(prefix)) {
      localStorage.removeItem(key)
    }
  }
}

const forNamespace = ns => {
  const forSubNamespace = sub => forNamespace(`${ns}::sub`)
  return supportsLocalStorage()
    ? {
        set: set.bind(null, ns),
        get: get.bind(null, ns),
        clear: clear.bind(null, ns),
        delete: del.bind(null, ns),
        forNamespace: forSubNamespace
      }
    : {
        set: noop,
        get: noop,
        clear: noop,
        delete: noop,
        forNamespace: forSubNamespace
      }
}

export default {forNamespace}
