import {combineLatest, from, map, type Observable, tap} from 'rxjs'

export interface Storage {
  readCount: () => Promise<number>
  writeCount: (value: number) => Promise<void>
  readHasDisplayed: () => Promise<boolean>
  writeHasDisplayed: (value: boolean) => Promise<void>
}

export type HintStatus = 'inactive' | 'active'

const STORAGE_NAMESPACE = ['studio', 'document-group-inventory', 'hint']
const COUNT_KEY = ['session-count']
const DISPLAYED_KEY = ['has-displayed']

/**
 * The number of sessions the hint is visible for.
 */
const SESSION_LIMIT = 3

/**
 * Special count value that indicates the hint has been intentionally
 * suppressed.
 */
const SUPPRESSED_COUNT = -1

export const browserStorageAdapter: Storage = {
  readCount: async () => {
    const item = localStorage.getItem(storageKey(COUNT_KEY))

    if (item === null) {
      return 0
    }

    let parsedItem

    try {
      parsedItem = JSON.parse(item)
    } catch {
      console.warn('Failed to parse:', item)
      return 0
    }

    if (typeof parsedItem === 'number') {
      return parsedItem
    }

    return 0
  },
  writeCount: async (value) => {
    localStorage.setItem(storageKey(COUNT_KEY), JSON.stringify(value))
  },
  readHasDisplayed: async () => {
    const item = sessionStorage.getItem(storageKey(DISPLAYED_KEY))

    if (item === null) {
      return false
    }

    let parsedItem

    try {
      parsedItem = JSON.parse(item)
    } catch {
      console.warn('Failed to parse:', item)
      return false
    }

    if (typeof parsedItem !== 'boolean') {
      return false
    }

    return parsedItem
  },
  writeHasDisplayed: async (value) => {
    sessionStorage.setItem(storageKey(DISPLAYED_KEY), JSON.stringify(value))
  },
}

export function hintStatus({
  readCount,
  writeCount,
  readHasDisplayed,
  writeHasDisplayed,
}: Storage): Observable<HintStatus> {
  return from(combineLatest([readCount(), readHasDisplayed()])).pipe(
    map(
      ([count, hasDisplayed]) =>
        [count, sessionCountToStatus(count), hasDisplayed] satisfies [number, HintStatus, boolean],
    ),
    tap(async ([value, status, hasDisplayed]) => {
      if (status === 'active' && !hasDisplayed) {
        await Promise.all([writeCount(value + 1), writeHasDisplayed(true)])
      }
    }),
    map(([, status]) => status),
  )
}

export function suppressHint({writeCount}: Storage): Promise<void> {
  return writeCount(SUPPRESSED_COUNT)
}

function storageKey(path: string[]): string {
  return STORAGE_NAMESPACE.concat(path).join('.')
}

export function sessionCountToStatus(sessionCount: number): HintStatus {
  if (sessionCount === SUPPRESSED_COUNT) {
    return 'inactive'
  }

  if (sessionCount > SESSION_LIMIT) {
    return 'inactive'
  }

  return 'active'
}
