import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
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
  // Deferred: `datasets$` is memoized on `client`, and switching project
  // triggers a full reload, so the client never swaps while this component
  // stays mounted. react-rx v5's built-in deferral is also identity-coherent,
  // so even a client swap would fall back to the new observable's live value.
  const datasets = useObservable(datasets$, null)

  return datasets
}
