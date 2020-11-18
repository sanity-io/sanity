import {merge, Subject} from 'rxjs'
import {filter, map, switchMap} from 'rxjs/operators'
import {resolveBackend} from './backends/resolve'

const storageBackend = resolveBackend()

const set$ = new Subject()

const prefixNamespace = (ns, key) => `${ns}::${key}`

const updates$ = set$.pipe(
  switchMap((event) =>
    storageBackend.set(event.key, event.value).pipe(
      map((nextValue) => ({
        key: event.key,
        value: nextValue,
      }))
    )
  )
)

const listen = (key, defValue) => {
  return merge(
    storageBackend.get(key, defValue),
    updates$.pipe(
      filter((update) => update.key === key),
      map((update) => update.value)
    )
  )
}

const set = (key, value) => {
  set$.next({key, value})
}

const forNamespace = (ns) => {
  return {
    forKey: (key) => {
      const namespacedKey = prefixNamespace(ns, key)
      return {
        listen: (defaultValue) => listen(namespacedKey, defaultValue),
        set: (value) => set(namespacedKey, value),
        del: () => set(namespacedKey, undefined),
      }
    },
    listen: (key, defaultValue) => listen(prefixNamespace(ns, key), defaultValue),
    set: (key, value) => set(prefixNamespace(ns, key), value),
    del: (key) => set(prefixNamespace(ns, key), undefined),
    forNamespace: (sub) => forNamespace(prefixNamespace(ns, sub)),
  }
}
export default {forNamespace}
