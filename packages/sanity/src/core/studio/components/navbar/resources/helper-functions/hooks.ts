import {useMemo} from 'react'
import {LoadableState, useLoadable} from '../../../../../util'
import {useClient} from '../../../../../hooks'
import {ResourcesResponse} from './types'
import {checkResourcesStatus} from './resourcesStatus'

/**
 * @internal
 */
export function useGetHelpResources(): LoadableState<ResourcesResponse | undefined> {
  const client = useClient()

  //gir response, loadingstatus og error
  const moduleStatus$ = useMemo(() => checkResourcesStatus(client), [client])

  return useLoadable(moduleStatus$) //tar observable og returnerer value isloading error.
}
