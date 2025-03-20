import {useEffect, useState} from 'react'
import {useClient, useCurrentUser} from 'sanity'

export function useQueryDocument(): {
  document: Document | undefined
  error: Error | undefined
  saveQuery: (query: Record<string, unknown>) => void
} {
  const client = useClient()
  const {id} = useCurrentUser()

  const [document, setDocument] = useState<Document | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const documentId = `vision.userQueries.${id}`

  useEffect(() => {
    const query$ = client.observable.getDocument(documentId).subscribe({
      next: (doc) => {
        // TODO: lint error
        if (doc) {
          // Document does not exist, create it
          setDocument(doc)
        } else {
          client
            .createIfNotExists({
              _id: documentId,
              _type: 'vision.userQueries',
              queries: [],
            })
            .then((createdDoc) => setDocument(createdDoc))
            .catch((err) => setError(err))
        }
      },
      error: (err) => setError(err),
    })

    return () => query$.unsubscribe()
  }, [client, documentId])

  const saveQuery = (query: Record<string, unknown>) => {
    client
      .patch(documentId)
      .setIfMissing({queries: []})
      .insert('before', 'queries[0]', [query])
      .commit()
      .then((updatedDoc) => setDocument(updatedDoc))
      .catch((err) => setError(err))
  }

  return {document, error, saveQuery}
}
