/** State the shell shares: color scheme, signed-in user, schema version, load timings. */
import {type User} from './auth'
import {SCHEME_KEY} from './config'
import {Atom} from './state'
import {storageGet, storageSet} from './util'

export type Scheme = 'light' | 'dark'

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function initialScheme(): [Scheme, boolean] {
  const stored = storageGet(SCHEME_KEY)
  if (stored === 'dark' || stored === 'light') return [stored, false]
  return [prefersDark() ? 'dark' : 'light', true]
}

const [startScheme, startSystem] = initialScheme()
export const scheme = new Atom<Scheme>(startScheme)
export const systemScheme = new Atom(startSystem)

export function setScheme(next: Scheme | undefined): void {
  if (next) {
    storageSet(SCHEME_KEY, next)
    systemScheme.set(false)
    scheme.set(next)
  } else {
    storageSet(SCHEME_KEY, 'system')
    systemScheme.set(true)
    scheme.set(prefersDark() ? 'dark' : 'light')
  }
}

export const user = new Atom<User | undefined>(undefined)
/** Bumped when a fresher schema replaces the cached one. */
export const schemaVersion = new Atom(0)
export const commandOpen = new Atom(false)

/** Load timings for the performance panel, in milliseconds since navigation start unless noted. */
export const perf = {
  scriptReady: performance.now(),
  auth: new Atom<number | undefined>(undefined),
  schema: new Atom<number | undefined>(undefined),
  schemaCached: new Atom(false),
  interactive: new Atom<number | undefined>(undefined),
  /** Duration of the first page of the latest document list. */
  list: new Atom<number | undefined>(undefined),
  listCached: new Atom(false),
}
