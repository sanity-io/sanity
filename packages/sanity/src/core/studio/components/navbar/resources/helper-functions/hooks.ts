import {useMemo} from 'react'
import {LoadableState, useLoadable} from '../../../../../util'
import {useCurrentLocale} from '../../../../../i18n/hooks/useLocale'
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
  const locale = useCurrentLocale()

  const moduleStatus$ = useMemo(() => getHelpResources(client, locale), [client, locale])

  return useLoadable(moduleStatus$)
}
