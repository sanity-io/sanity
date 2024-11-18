import {useMemo} from 'react'

import {useStudioPerspectiveState} from '../hooks'
import {getReleasesStack} from '../hooks/utils'
import {useReleases} from './useReleases'

export function useReleasesStack() {
  const {data: releases} = useReleases()
  const {current, excluded} = useStudioPerspectiveState()
  return useMemo(
    () => getReleasesStack({releases, current, excluded}),
    [current, excluded, releases],
  )
}
