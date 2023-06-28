import {useMemo} from 'react'
import {LoadableState, useLoadable} from '../../../../../util'
import {useClient} from '../../../../../hooks'
import {ResourcesResponse} from './types'
import {getHelpResources} from './helpResources'

/**
 * Fetch help resources (content for the navbar help menu) from `/help`.
 *
 * @internal
 * @hidden
 */
export function useGetHelpResources(): LoadableState<ResourcesResponse | undefined> {
  const client = useClient({apiVersion: '1'})

  const moduleStatus$ = useMemo(() => getHelpResources(client), [client])

  return useLoadable(moduleStatus$)
}
