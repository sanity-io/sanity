import {merge, Observable, Subject} from 'rxjs'
import {filter, map, switchMap} from 'rxjs/operators'
import {resolveBackend} from './backends/resolve'
import {Settings, SettingsStore} from './types'

/** @internal */
export function createSettingsStore(): SettingsStore {
  const storageBackend = resolveBackend()

  const set$ = new Subject<{key: string; value: unknown}>()

  const prefixNamespace = (ns: string, key: string) => `${ns}::${key}`

  const updates$ = set$.pipe(
    switchMap((event) =>
      storageBackend.set(event.key, event.value).pipe(
        map((nextValue) => ({
          key: event.key,
          value: nextValue,
        })),
      ),
    ),
  )

  const listen = (key: string, defValue: unknown): Observable<unknown> => {
    return merge(
      storageBackend.get(key, defValue),
      updates$.pipe(
        filter((update) => update.key === key),
        map((update) => update.value),
      ),
    )
  }

  const set = (key: string, value: unknown) => {
    set$.next({key, value})
  }

  const forNamespace = (ns: string): Settings => {
    return {
      forKey: (key: string) => {
        const namespacedKey = prefixNamespace(ns, key)

        return {
          listen: (defaultValue: unknown) => listen(namespacedKey, defaultValue),
          set: (value: unknown) => set(namespacedKey, value),
          del: () => set(namespacedKey, undefined),
        }
      },
      listen: (key: string, defaultValue: unknown) => {
        return listen(prefixNamespace(ns, key), defaultValue)
      },
      set: (key: string, value: unknown) => {
        return set(prefixNamespace(ns, key), value)
      },
      del: (key: string) => {
        return set(prefixNamespace(ns, key), undefined)
      },
      forNamespace: (sub: string) => {
        return forNamespace(prefixNamespace(ns, sub))
      },
    }
  }

  return {forNamespace}
}
