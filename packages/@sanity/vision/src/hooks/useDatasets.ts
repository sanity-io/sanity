import type {SanityClient} from '@sanity/client'
import {useEffect, useState} from 'react'

export function useDatasets(client: SanityClient): string[] | Error | undefined {
  const projectId = client.config().projectId
  const [datasets, setDatasets] = useState<string[] | Error | undefined>()

  useEffect(() => {
    const datasets$ = client.observable.datasets.list().subscribe({
      next: (result) => setDatasets(result.map((ds) => ds.name)),
      error: (err) => setDatasets(err),
    })

    return () => datasets$.unsubscribe()
  }, [client, projectId])

  return datasets || undefined
}
