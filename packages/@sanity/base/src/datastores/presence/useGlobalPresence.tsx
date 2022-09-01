import type {User} from '@sanity/types'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {useState, useEffect} from 'react'
import type {GlobalPresence} from './types'
import {globalPresence$} from './presence-store'

export function useGlobalPresence(): GlobalPresence[] {
  const [presence, setPresence] = useState<GlobalPresence[]>([])
  useEffect(() => {
    const subscription = globalPresence$.subscribe(setPresence)
    return () => subscription.unsubscribe()
  }, [])
  return presence
}

/**
 * Returns a list of global presence users without any last active timestamps or paths etc.
 * This is useful for displaying a list of users without re-rendering on minimal changes,
 * such as a user changing which field they are editing.
 *
 * @internal Will be removed/refactored in v3
 * @deprecated Will be removed/refactored in v3
 */
export function useGlobalPresenceUsers(): User[] {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const subscription = globalPresence$
      .pipe(
        map((items) => items.map((item) => item.user)),
        distinctUntilChanged(
          (usersA, usersB) =>
            usersA.length === usersB.length &&
            usersA.some((user, index) => usersB[index].id === user.id)
        )
      )
      .subscribe(setUsers)
    return () => subscription.unsubscribe()
  }, [])

  return users
}
