import {type SanityDocument} from '@sanity/client'
import {useEffect, useState} from 'react'
import {useClient, useCurrentUser} from 'sanity'

// import {type SupportedPerspective} from '../perspectives'

interface QueryConfig {
  url: string
  // query: string
  // params: string
  // perspective: SupportedPerspective
  savedAt: string
  _key: string
}

interface UserQueryDocument extends SanityDocument {
  queries: QueryConfig[]
}
// TODO swap to add-on dataset
export function useQueryDocument(): {
  document: UserQueryDocument | undefined
  error: Error | undefined
  saveQuery: (query: Record<string, unknown>) => void
  deleteQuery: (key: string) => void
  saving: boolean
  saveQueryError: Error | undefined
  deleting: string[]
  deleteQueryError: Error | undefined
} {
  const client = useClient({apiVersion: '2025-03-21'})
  const currentUser = useCurrentUser()
  const id = currentUser?.id
  const [document, setDocument] = useState<UserQueryDocument | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [saving, setSaving] = useState(false)
  const [saveQueryError, setSaveQueryError] = useState<Error | undefined>()
  const [deleting, setDeleting] = useState<string[]>([])
  const [deleteQueryError, setDeleteQueryError] = useState<Error | undefined>()
  const documentId = `vision.userQueries.${id}`

  useEffect(() => {
    const query$ = client.observable.getDocument(documentId).subscribe({
      next: (doc) => {
        if (doc) {
          setDocument(doc as UserQueryDocument)
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

  const saveQuery = async (query: Record<string, unknown>) => {
    setSaving(true)
    setSaveQueryError(undefined)
    await client
      .patch(documentId)
      .setIfMissing({queries: []})
      .insert('before', 'queries[0]', [query])
      .commit({autoGenerateArrayKeys: true})
      .then((updatedDoc) => setDocument(updatedDoc as UserQueryDocument))
      .catch((err) => setSaveQueryError(err))
      .finally(() => setSaving(false))
  }

  const deleteQuery = async (key: string) => {
    setDeleting((prev) => [...prev, key])
    setDeleteQueryError(undefined)
    await client
      .patch(documentId)
      .unset([`queries[_key == "${key}"]`])
      .commit()
      .then((updatedDoc) => setDocument(updatedDoc as UserQueryDocument))
      .catch((err) => setDeleteQueryError(err))
      .finally(() => setDeleting((prev) => prev.filter((k) => k !== key)))
  }

  return {
    document,
    error,
    saveQuery,
    deleteQuery,
    saving,
    saveQueryError,
    deleting,
    deleteQueryError,
  }
}
