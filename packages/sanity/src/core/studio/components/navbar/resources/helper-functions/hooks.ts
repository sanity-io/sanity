import {useMemo} from 'react'
import {LoadableState, useLoadable} from '../../../../../util'
import {useClient} from '../../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {ResourcesResponse} from './types'
import {checkResourcesStatus} from './resourcesStatus'

/**
 * @internal
 */
export function useGetHelpResources(): LoadableState<ResourcesResponse | undefined> {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const moduleStatus$ = useMemo(() => checkResourcesStatus(client), [client])

  return useLoadable(moduleStatus$)
}
