import {useMemo} from 'react'

import {useClient} from '../../../../../hooks'
import {useCurrentLocale} from '../../../../../i18n/hooks/useLocale'
import {type LoadableState, useLoadable} from '../../../../../util'
import {getHelpResources} from './helpResources'
import {type ResourcesResponse} from './types'

/**
 * Fetch help resources (content for the navbar help menu) from `/help`.
 *
 * @internal
 * @hidden
 */
export function useGetHelpResources(): LoadableState<ResourcesResponse | undefined> {
  const client = useClient({apiVersion: '1'})
  const locale = useCurrentLocale().id

  const moduleStatus$ = useMemo(() => getHelpResources(client, locale), [client, locale])

  return useLoadable(moduleStatus$)
}
