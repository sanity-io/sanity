// TODO: Remove this eslint-disable
/* eslint-disable i18next/no-literal-string */
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
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
  useSchema,
} from 'sanity'

import {useDocumentPane} from '../../useDocumentPane'
import {CreateNewIncomingReference} from './CreateNewIncomingReference'
import {IncomingReferenceDocument} from './IncomingReferenceDocument'

const TypeTitle = ({type}: {type: string}) => {
  const schema = useSchema()
  const schemaType = schema.get(type)
  return (
    <Box padding={2}>
      <Text size={1} weight="medium">
        {schemaType?.title}
      </Text>
    </Box>
  )
}

const INITIAL_STATE = {
  list: [],
  loading: true,
}
function getIncomingReferences({
  publishedId,
  documentPreviewStore,
}: {
  publishedId: PublishedId
  documentPreviewStore: DocumentPreviewStore
}): Observable<{
  list: {
    type: string
    documents: SanityDocument[]
  }[]
  loading: boolean
}> {
  return documentPreviewStore
    .unstable_observeDocumentIdSet(`references("${publishedId}")`, {
      insert: 'prepend',
    })
    .pipe(
      map((state) => state.documentIds),
      mergeMapArray((id: string) => {
        return documentPreviewStore.unstable_observeDocument(id).pipe(
          filter(Boolean),
          map((doc) => doc),
        )
      }),
      // Remove duplicates due to different versions of the same document.
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
        const types = documents.map((doc) => doc._type)
        const uniqueTypes = [...new Set(types)].sort((a, b) => a.localeCompare(b))
        return uniqueTypes.map((type) => ({
          type,
          documents: documents.filter((doc) => doc._type === type),
        }))
      }),
      map((list) => ({list, loading: false})),
      startWith(INITIAL_STATE),
    )
}

export function IncomingReferencesList() {
  const {documentId, documentType} = useDocumentPane()
  const schema = useSchema()
  const schemaType = schema.get(documentType)
  const referencedBy = schemaType?.options?.referencedBy as string[] | undefined

  const documentPreviewStore = useDocumentPreviewStore()
  const publishedId = getPublishedId(documentId)
  const references$ = useMemo(
    () => getIncomingReferences({publishedId, documentPreviewStore}),
    [publishedId, documentPreviewStore],
  )
  const references = useObservable(references$, INITIAL_STATE)

  if (!referencedBy || referencedBy?.length === 0) {
    return (
      <Box padding={2}>
        <Card border radius={3} padding={1} tone="default">
          <Box paddingY={3} paddingX={2}>
            <Text size={1} muted>
              No incoming references defined for this type, see the docs for more information.
            </Text>
          </Box>
        </Card>
      </Box>
    )
  }
  if (references.loading) {
    return <LoadingBlock showText title={'Loading documents'} />
  }
  return (
    <>
      {referencedBy.map((type) => {
        const documents = references.list.find((list) => list.type === type)?.documents

        return (
          <Stack key={type} padding={2} space={1} marginBottom={2}>
            <Flex align="center" justify="space-between" paddingBottom={2} gap={2}>
              <TypeTitle type={type} />
              <CreateNewIncomingReference
                type={type.type}
                referenceToType={documentType}
                referenceToId={documentId}
              />
            </Flex>
            {documents && documents.length > 0 ? (
              documents.map((document) => (
                <IncomingReferenceDocument
                  key={document._id}
                  document={document}
                  referenceToId={documentId}
                />
              ))
            ) : (
              <Box padding={0}>
                <Card border radius={3} padding={1} tone="default">
                  <Box paddingY={3} paddingX={2}>
                    <Text size={1} muted>
                      No references of this type found.
                    </Text>
                  </Box>
                </Card>
              </Box>
            )}
          </Stack>
        )
      })}
    </>
  )
}
