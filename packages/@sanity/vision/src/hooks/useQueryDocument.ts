import {type SanityDocument} from '@sanity/client'
import {useEffect, useState} from 'react'
import {useClient, useCurrentUser} from 'sanity'

interface QueryConfig {
  query: string
  params: string
  perspective: string
  savedAt: string
  _key: string
}

interface UserQueryDocument extends SanityDocument {
  queries: QueryConfig[]
}

export function useQueryDocument(): {
  document: UserQueryDocument | undefined
  error: Error | undefined
  saveQuery: (query: Record<string, unknown>) => void
  deleteQuery: (key: string) => void
} {
  const client = useClient()
  const {id} = useCurrentUser()

  const [document, setDocument] = useState<UserQueryDocument | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const documentId = `vision.userQueries.${id}`

  useEffect(() => {
    const query$ = client.observable.getDocument(documentId).subscribe({
      next: (doc) => {
        if (doc) {
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
      .commit({autoGenerateArrayKeys: true})
      .then((updatedDoc) => setDocument(updatedDoc))
      .catch((err) => setError(err))
  }

  const deleteQuery = (key: string) => {
    client
      .patch(documentId)
      .unset([`queries[_key == "${key}"]`])
      .commit()
      .then((updatedDoc) => setDocument(updatedDoc))
      .catch((err) => setError(err))
  }

  return {document, error, saveQuery, deleteQuery}
}
