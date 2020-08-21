import {of} from 'rxjs'
import {useObservable} from '../util/useObservable'
import {useUserColorManager} from './provider'
import {UserColor} from './types'
import React from 'react'

export function useUserColor(userId: string | null): UserColor | null {
  const manager = useUserColorManager()
  return useObservable(
    userId === null ? of(null) : React.useMemo(() => manager.listen(userId), [userId])
  )
}
