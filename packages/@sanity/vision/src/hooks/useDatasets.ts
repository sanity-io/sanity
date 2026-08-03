import {type SanityClient} from '@sanity/client'
import {useDeferredValue, useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {catchError, map, type Observable, of} from 'rxjs'

import {type VisionConfig} from '../types'

export function useDatasets({
  client,
  datasets: configDatasets,
}: {
  client: SanityClient
  datasets: VisionConfig['datasets']
}): string[] | Error | null {
  const datasets$: Observable<string[] | Error> = useMemo(() => {
    if (Array.isArray(configDatasets)) {
      return of(configDatasets)
    }
    return client.observable.datasets.list().pipe(
      map((result) => {
        if (typeof configDatasets == 'function') {
          return configDatasets(result).map((d) => d.name)
        }
        return result.map((ds) => ds.name)
      }),
      catchError((err) => of(err)),
    )
  }, [client, configDatasets])
  // A bare deferral is fine here: `datasets$` is memoized on `client`, and
  // switching project triggers a full reload, so the client never swaps while
  // this component stays mounted — there's no identity churn to guard against.
  const datasets = useDeferredValue(useSyncObservable(datasets$, null))

  return datasets
}
