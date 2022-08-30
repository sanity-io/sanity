import {distinctUntilChanged, map} from 'rxjs/operators'
import {isEqual, omit} from 'lodash'
import {useState, useEffect} from 'react'
import type {GlobalPresence, MinimalGlobalPresence} from './types'
import {globalPresence$} from './presence-store'

export function useGlobalPresence(): GlobalPresence[] {
  const [presence, setPresence] = useState<GlobalPresence[]>([])
  useEffect(() => {
    const subscription = globalPresence$.subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  return presence
}

/**
 * Returns a list of global presence items without any last active timestamps or paths within a
 * document. This is useful for displaying a list of users without re-rendering on minimal changes,
 * such as a user changing which field they are editing.
 *
 * @internal Rework this for v3
 */
export function useMinimalGlobalPresence(): MinimalGlobalPresence[] {
  const [presence, setPresence] = useState<MinimalGlobalPresence[]>([])
  useEffect(() => {
    const subscription = globalPresence$
      .pipe(
        map((items) => items.map(removeSpecifics)),
        distinctUntilChanged(isEqual)
      )
      .subscribe(setPresence)

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  return presence
}

function removeSpecifics({lastActiveAt, ...item}: GlobalPresence): MinimalGlobalPresence {
  return {
    ...item,
    locations: item.locations.map((location) => omit(location, ['lastActiveAt'])),
  }
}
