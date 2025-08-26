import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {filter, map, type Observable, startWith} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {
  type DocumentPreviewStore,
  getPublishedId,
  LoadingBlock,
  type PublishedId,
  type SanityDocument,
  useDocumentPreviewStore,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {IncomingReferencesType} from './IncomingReferencesType'
import {type LinkedDocumentActions, type OnLinkDocumentCallback} from './types'

const INITIAL_STATE = {
  list: [],
  loading: true,
}
function getIncomingReferences({
  publishedId,
  documentPreviewStore,
  types,
}: {
  publishedId: PublishedId
  documentPreviewStore: DocumentPreviewStore
  types: string[]
}): Observable<{
  list: {
    type: string
    documents: SanityDocument[]
  }[]
  loading: boolean
}> {
  return documentPreviewStore
    .unstable_observeDocumentIdSet(
      `references("${publishedId}") && _type in $types`,
      {types},
      {insert: 'append'},
    )
    .pipe(
      map((state) => state.documentIds),
      mergeMapArray((id: string) => {
        return documentPreviewStore.unstable_observeDocument(id).pipe(
          filter(Boolean),
          map((doc) => doc),
        )
      }),
      // Remove duplicates due to different versions of the same document.
      // TODO: do we want to do this? Or maybe we show each of the versions?
      map((documents) => {
        const seenPublishedId: string[] = []
        return documents.filter((doc) => {
          const pId = getPublishedId(doc._id)
          if (seenPublishedId.includes(pId)) return false

          seenPublishedId.push(pId)
          return true
        })
      }),
      map((documents) => {
        return types.map((type) => ({
          type,
          documents: documents.filter((doc) => doc._type === type),
        }))
      }),
      map((list) => ({list, loading: false})),
      startWith(INITIAL_STATE),
    )
}

export function IncomingReferencesList({
  types,
  onLinkDocument,
  actions,
}: {
  types: string[]
  onLinkDocument?: OnLinkDocumentCallback
  actions?: LinkedDocumentActions
}) {
  const {documentId, documentType} = useDocumentPane()

  const documentPreviewStore = useDocumentPreviewStore()
  const publishedId = getPublishedId(documentId)
  const references$ = useMemo(
    () => getIncomingReferences({publishedId, documentPreviewStore, types}),
    [publishedId, documentPreviewStore, types],
  )
  const references = useObservable(references$, INITIAL_STATE)

  if (!types || types?.length === 0) {
    return (
      <Card border radius={2} padding={3} tone="critical">
        <Flex align="center" justify="center">
          <Text size={1} muted>
            No incoming references defined for this type, see the docs for more information.
          </Text>
        </Flex>
      </Card>
    )
  }

  if (references.loading) {
    return <LoadingBlock showText title={'Loading documents'} />
  }
  return (
    <Stack space={3}>
      {types.map((type) => {
        const documents = references.list.find((list) => list.type === type)?.documents

        return (
          <IncomingReferencesType
            key={type}
            type={type}
            documents={documents}
            referenced={{id: documentId, type: documentType}}
            onLinkDocument={onLinkDocument}
            actions={actions}
            shouldRenderTitle={types.length > 1}
          />
        )
      })}
    </Stack>
  )
}
