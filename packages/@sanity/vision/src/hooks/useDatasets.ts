import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {catchError, map, type Observable, of} from 'rxjs'
import {useShallowUnique} from 'sanity'

import {type VisionConfig} from '../types'

export function useDatasets({
  client,
  datasets: unstableConfigDatasets,
}: {
  client: SanityClient
  datasets: VisionConfig['datasets']
}): ObservablePromise<string[] | Error> {
  // Keyed on contents: plugin config naturally holds an inline array literal
  // (`datasets: ['a', 'b']`), and its reference feeds the observable identity
  // below — a fresh identity per render would leave `useObservablePromise`
  // with a new pending promise each render. Function configs compare by
  // identity.
  const configDatasets = useShallowUnique(unstableConfigDatasets)
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

  return useObservablePromise(datasets$)
}
