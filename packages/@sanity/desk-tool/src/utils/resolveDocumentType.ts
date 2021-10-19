// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />
import documentStore from 'part:@sanity/base/datastore/document'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {useEffect, useState} from 'react'

export function removeDraftPrefix(documentId: string): string {
  const publishedId = getPublishedId(documentId)

  if (publishedId !== documentId) {
    console.warn(
      'Removed unexpected draft id in document link: All links to documents should have the ' +
        '`drafts.`-prefix removed and something appears to have made an intent link to `%s`',
      documentId
    )
  }

  return publishedId
}

export function useDocumentType(
  documentId: string,
  specifiedType?: string
): {documentType?: string; isLoaded: boolean} {
  const isResolved = isResolvedDocumentType(specifiedType)
  const [{documentType, isLoaded}, setDocumentType] = useState<{
    documentType?: string
    isLoaded: boolean
  }>({
    isLoaded: isResolved,
    documentType: isResolved ? specifiedType : undefined,
  })

  // Reset documentType when documentId changes
  useEffect(() => {
    setDocumentType({
      isLoaded: isResolved,
      documentType: isResolved ? specifiedType : undefined,
    })
  }, [documentId, isResolved, specifiedType])

  // Load the documentType from Content Lake
  useEffect(() => {
    if (isResolved) {
      return undefined
    }

    const sub = documentStore
      .resolveTypeForDocument(documentId, specifiedType)
      .subscribe((typeName: string) => setDocumentType({documentType: typeName, isLoaded: true}))

    return () => sub.unsubscribe()
  }, [documentId, specifiedType, isResolved])

  return {documentType, isLoaded}
}

function isResolvedDocumentType(specifiedType?: string): specifiedType is string {
  return Boolean(specifiedType && specifiedType !== '*')
}
