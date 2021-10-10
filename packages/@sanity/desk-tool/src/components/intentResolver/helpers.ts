// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {useEffect, useState} from 'react'
import {of} from 'rxjs'
import {map} from 'rxjs/operators'
import {versionedClient as client} from '../../versionedClient'

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
  }>({isLoaded: isResolved, documentType: isResolved ? specifiedType : undefined})

  useEffect(() => {
    if (isResolved) {
      return () => {
        // intentional noop
      }
    }

    const sub = resolveTypeForDocument(documentId, specifiedType).subscribe((typeName) =>
      setDocumentType({documentType: typeName, isLoaded: true})
    )

    return () => sub.unsubscribe()
  })

  return {documentType, isLoaded}
}

function isResolvedDocumentType(specifiedType?: string): boolean {
  return Boolean(specifiedType && specifiedType !== '*')
}

function resolveTypeForDocument(id: string, specifiedType?: string) {
  if (isResolvedDocumentType(specifiedType)) {
    return of(specifiedType)
  }

  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = getPublishedId(id)
  const draftId = `drafts.${documentId}`

  return client.observable.fetch(query, {documentId, draftId}).pipe(map((types) => types[0]))
}
