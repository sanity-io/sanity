import {Observable} from 'rxjs'

/** @internal */
export interface Settings {
  forKey: (key: string) => {
    listen: (defaultValue: unknown) => Observable<unknown>
    set: (value: string) => void
    del: () => void
  }
  listen: (key: string, defaultValue: unknown) => Observable<unknown>
  set: (key: string, value: unknown) => void
  del: (key: string) => void
  forNamespace: (sub: string) => Settings
}

/** @internal */
export interface SettingsStore {
  forNamespace: (ns: string) => Settings
}
