import {useEffect, useRef, useState} from 'react'
import {type SanityClient} from 'sanity'

import {useListener} from './useListener'

function pollingReducer(state, action) {}

export function useListenerPolling(documentIds: string[], client: SanityClient) {
  //   const [state, dispatch] = useReducer(pollingReducer, INITIAL_STATE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const listenQuery = documentIds.reduce(
    (accQuery, documentId, index) =>
      `${accQuery} _id in path("${documentId}.*")${index === documentIds.length - 1 ? ')]' : ' ||'}`,
    '*[defined(_version) && (',
  )
  console.log({listenQuery})
  const {documents} = useListener({query: listenQuery, client})

  useEffect(() => {
    const runQuery = async () => {
      const query = `{
        "results": *[_id match $bundleId + ".*"]{
          _updatedAt
        } | order(_updatedAt desc),
      }{
         "lastEdited": results[0]._updatedAt,
         "versionDocuments": count(results)
      }`
      const mappedBundles = await Promise.all(
        data.map((bundle) => c.fetch(query, {bundleId: 'pedro-summer'})),
      )

      const result = data.map((bundle, index) => ({
        ...bundle,
        ...mappedBundles[index],
      }))

      console.log({result})
    }

    runQuery()
  }, [documents])

  const didInitialFetch = useRef<boolean>(false)

  //   const executeQuery = async () => {
  //     if (!documentIds.length) return

  //     console.log({query})
  //     const result = await client.fetch(query)

  //     console.log({result})
  //   }
}
