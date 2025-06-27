import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {catchError, map, of} from 'rxjs'

import {type VisionConfig} from '../types'

export function useDatasets({
  client,
  datasets: configDatasets,
}: {
  client: SanityClient
  datasets: VisionConfig['datasets']
}): string[] | Error | undefined {
  const datasets$: Observable<string[] | Error> = useMemo(() => {
    if (configDatasets && Array.isArray(configDatasets)) {
      return of(configDatasets)
    }
    return client.observable.datasets.list().pipe(
      map((result) => {
        const datasets = result.map((ds) => ds.name)
        if (typeof configDatasets == 'function') {
          return configDatasets(datasets)
        }
        return datasets
      }),
      catchError((err) => of(err)),
    )
  }, [client, configDatasets])
  const datasets = useObservable(datasets$, null)

  return datasets || undefined
}
