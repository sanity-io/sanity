import {concat, of, fromEvent} from 'rxjs'
import {distinctUntilChanged, map} from 'rxjs/operators'

const DEBUG_PREFIX = '_debug_'

const hashchange$ = typeof window === 'undefined' ? of({}) : fromEvent(window, 'hashchange')

export const debugParams$ = concat(of(0), hashchange$).pipe(
  map(() => (typeof document === 'undefined' ? '#' : document.location.hash)),
  distinctUntilChanged(),
  map((hash) =>
    hash
      .substring(1)
      .split(';')
      .filter((p) => p.toLowerCase().startsWith(DEBUG_PREFIX))
      .map((param) => param.substring(DEBUG_PREFIX.length)),
  ),
)

export const debugRolesParam$ = debugParams$.pipe(
  map((args) => args.find((arg) => arg.startsWith('roles='))),
  map(
    (arg) =>
      arg
        ?.split('roles=')[1]
        .split(',')
        .map((r) => r.trim()) || [],
  ),
)
