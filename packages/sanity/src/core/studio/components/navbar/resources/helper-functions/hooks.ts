import {useMemo} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {catchError, of} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {useCurrentLocale} from '../../../../../i18n/hooks/useLocale'
import {getHelpResources} from './helpResources'
import {type ResourcesResponse} from './types'

/**
 * Fetch help resources (content for the navbar help menu) from `/help`, as a promise for `use()`.
 *
 * The request starts when the calling component commits, so call this from the visible menu
 * button and read the promise below a `<Suspense>` boundary inside the menu. A failed request
 * settles as `undefined`, which the menu renders as its fallback links.
 *
 * @internal
 * @hidden
 */
export function useHelpResourcesPromise(): ObservablePromise<ResourcesResponse | undefined> {
  const client = useClient({apiVersion: '1'})
  const locale = useCurrentLocale().id

  const resources$ = useMemo(
    () => getHelpResources(client, locale).pipe(catchError(() => of(undefined))),
    [client, locale],
  )

  return useObservablePromise(resources$)
}
