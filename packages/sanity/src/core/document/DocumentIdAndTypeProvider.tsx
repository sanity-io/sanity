import React, {useEffect, useMemo, useState} from 'react'
import {first} from 'rxjs'
import {getPublishedId} from '../util'
import {useTemplates} from '../hooks'
import {useDocumentStore} from '../store'
import {Template} from '../templates'
import {DocumentIdAndTypeContext, DocumentIdAndTypeContextValue} from './DocumentIdAndTypeContext'

export interface DocumentIdAndTypeProviderProps {
  documentId: string
  documentType: string | undefined
  templateName: string | undefined
  children: React.ReactNode
  fallback: React.ReactNode
}

export function DocumentIdAndTypeProvider({
  fallback,
  children,
  documentType: typeFromProps,
  documentId: idFromProps,
  templateName,
}: DocumentIdAndTypeProviderProps) {
  const documentId = getPublishedId(idFromProps)
  const templates = useTemplates()
  const documentStore = useDocumentStore()

  const [error, setError] = useState<Error | null>(null)
  if (error) throw error

  // generate a lookup object for templates by their IDs
  const templatesById = useMemo(() => {
    return templates.reduce<Record<string, Template>>((acc, t) => {
      acc[t.id] = t
      return acc
    }, {})
  }, [templates])

  // determines the initial `documentType` based on the following priority:
  // 1. the value provided in `typeFromProps`, unless it's a legacy value.
  // 2. the schema type associated with the template name in `templatesById`.
  // 3. defaults to `null` if neither source provides a valid value.

  // mote: The legacy value `' * '` was used historically to denote an unspecified
  // document type. We want to ensure it's not used to initialize `documentType`.
  const [documentType, setDocumentType] = useState<string | null>(() => {
    // check for a valid `typeFromProps` (excluding the legacy value).
    if (typeFromProps && typeFromProps !== '*') return typeFromProps

    // determine the document type from the template's schema type.
    const typeFromTemplates = templateName && templatesById[templateName]?.schemaType
    if (typeFromTemplates) return typeFromTemplates

    // default to `null` if no valid type is determined.
    return null
  })

  useEffect(() => {
    // exit early if document type is already determined.
    if (documentType) return undefined

    // fetch and set the document type from the document store
    const subscription = documentStore
      .resolveTypeForDocument(documentId)
      // note: this operation is only done once to maintain consistency with
      // other non-reactive code paths.
      .pipe(first())
      .subscribe({
        next: (documentTypeFromContentLake) => {
          if (documentTypeFromContentLake) {
            setDocumentType(documentTypeFromContentLake)
          } else {
            setError(
              new Error(`Could not resolve document type for document with ID ${documentId}`),
            )
          }
        },
        error: setError,
      })

    return () => subscription.unsubscribe()
  }, [documentId, documentStore, documentType])

  if (!documentType) return <>{fallback}</>

  const contextValue: DocumentIdAndTypeContextValue = {
    documentId,
    documentType,
  }

  return (
    <DocumentIdAndTypeContext.Provider value={contextValue}>
      {children}
    </DocumentIdAndTypeContext.Provider>
  )
}
