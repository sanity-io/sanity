import {groq, type GroqStore, groqStore} from '@sanity/groq-store'
import {type SanityDocument} from '@sanity/types'
import {useEffect, useMemo, useRef, useState} from 'react'
import {getDraftId, useDataset, useProjectId} from 'sanity'

export const useAltStore = (documentType: string) => {
  const projectId = useProjectId()
  const dataset = useDataset()

  const store = useRef<GroqStore | undefined>()
  // groqStore({
  //   projectId,
  //   dataset,

  //   // Keep dataset up to date with remote changes. Default: false
  //   listen: true,

  //   // "Replaces" published documents with drafts, if available.
  //   // Note that document IDs will not reflect draft status, currently
  //   overlayDrafts: true,

  //   // Optional limit on number of documents, to prevent using too much memory unexpectedly
  //   // Throws on the first operation (query, retrieval, subscription) if reaching this limit.
  //   // documentLimit: 50000,

  //   // Optional allow list filter for document types. You can use this to limit the amount of documents by declaring the types you want to sync. Note that since you're fetching a subset of your dataset, queries that works against your Content Lake might not work against the local groq-store.
  //   // You can quickly list all your types using this query: `array::unique(*[]._type)`
  //   // includeTypes: ['string', 'number', 'boolean'],
  // }),
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<SanityDocument[]>([])

  useEffect(() => {
    const {current: activeStore} = store
    if (activeStore) {
      const sub = activeStore.subscribe(
        groq`*[_type == "${documentType}"][0...10]`,
        {type: documentType}, // Params
        (err, result) => {
          if (err) {
            console.error('Oh no, an error:', err)
            setIsLoading(false)
            setError(err.message)
            return
          }
          setData(result)
        },
      )

      return () => {
        sub.unsubscribe()
      }
    }

    return () => null
  }, [documentType])

  useEffect(() => {
    const activeStore = store.current

    if (!store.current) {
      store.current = groqStore({
        projectId,
        dataset,

        // Keep dataset up to date with remote changes. Default: false
        listen: true,

        // "Replaces" published documents with drafts, if available.
        // Note that document IDs will not reflect draft status, currently
        overlayDrafts: true,

        // Optional limit on number of documents, to prevent using too much memory unexpectedly
        // Throws on the first operation (query, retrieval, subscription) if reaching this limit.
        // documentLimit: 50000,

        // Optional allow list filter for document types. You can use this to limit the amount of documents by declaring the types you want to sync. Note that since you're fetching a subset of your dataset, queries that works against your Content Lake might not work against the local groq-store.
        // You can quickly list all your types using this query: `array::unique(*[]._type)`
        // includeTypes: ['string', 'number', 'boolean'],
      })
    }

    return () => {
      if (activeStore) {
        activeStore.close()
      }
    }
  }, [dataset, projectId])

  const documentsKeyed = useMemo(() => {
    return data.reduce<Record<string, SanityDocument>>((acc, document) => {
      const key = document._id
      const isDraft = key === getDraftId(key)
      const id = isDraft ? key : getDraftId(key)

      if (acc[id] && !isDraft) {
        return acc
      }

      acc[id] = document
      return acc
    }, {})
  }, [data])

  return {data, documents: documentsKeyed, isLoading, error}
}

export const useWorkerAltStore = (
  documentType: string,
  pagination: {pageIndex: number; pageSize: number},
) => {
  const [data, setData] = useState<SanityDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const projectId = useProjectId()
  const dataset = useDataset()

  const workerRef = useRef<Worker | undefined>()

  useEffect(() => {
    workerRef.current = new Worker(new URL('./altStoreWorker.ts', import.meta.url), {
      type: 'module',
    })

    workerRef.current.postMessage({
      type: 'INIT_STORE',
      projectId,
      dataset,
    })

    workerRef.current.onmessage = (event) => {
      const {type, documents, message} = event.data
      switch (type) {
        case 'DATA':
          setData(documents)
          setIsLoading(false)
          break
        case 'ERROR':
          console.error('Error from worker:', message)
          setError(message)
          setIsLoading(false)
          break
        default:
          console.error('Received unknown message type from worker')
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({type: 'CLOSE_STORE'})
        workerRef.current.terminate()
      }
    }
  }, [dataset, projectId])
  const {pageIndex, pageSize} = pagination

  useEffect(() => {
    setIsLoading(true)
    const range = `[${pageIndex * pageSize}...${pageIndex * pageSize + pageSize}]`
    const query = `*[_type == "${documentType}"]${range}`
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SUBSCRIBE',
        query,
        params: {type: documentType},
      })
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({type: 'UNSUBSCRIBE'})
      }
    }
  }, [documentType, pageIndex, pageSize])

  const documentsKeyed = useMemo(() => {
    return data.reduce<Record<string, SanityDocument>>((acc, document) => {
      const key = document._id
      const isDraft = key === getDraftId(key)
      const id = isDraft ? key : getDraftId(key)

      if (acc[id] && !isDraft) {
        return acc
      }

      acc[id] = document
      return acc
    }, {})
  }, [data])

  return {data, documents: documentsKeyed, isLoading, error}
}
