import {type SanityDocument} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  LoadingBlock,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useSource,
  useTranslation,
} from 'sanity'

import {CrossDatasetIncomingReferenceDocumentPreview} from '../../../../components/incomingReferencesDecoration/CrossDatasetIncomingReference/CrossDatasetIncomingReferenceDocumentPreview'
import {
  type CrossDatasetIncomingReferenceDocument,
  getCrossDatasetIncomingReferences,
} from '../../../../components/incomingReferencesDecoration/CrossDatasetIncomingReference/getCrossDatasetIncomingReferences'
import {getIncomingReferences} from '../../../../components/incomingReferencesDecoration/getIncomingReferences'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {IncomingReferenceDocument} from './IncomingReferenceDocument'

const TypeTitle = ({type}: {type: string}) => {
  const schema = useSchema()
  const schemaType = schema.get(type)
  return (
    <Flex align="center" justify="space-between" paddingBottom={2} gap={2}>
      <Box padding={2}>
        <Text size={1} weight="medium">
          {schemaType?.title || type}
        </Text>
      </Box>
    </Flex>
  )
}

export function IncomingReferencesList() {
  const {documentId} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)
  const {getClient} = useSource()
  const documentPreviewStore = useDocumentPreviewStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const references$ = useMemo(
    () =>
      getIncomingReferences({
        documentId,
        documentPreviewStore,
        getClient,
      }).pipe(
        map(({documents}) => {
          const documentsByType = documents.reduce(
            (acc, doc) => {
              const type = doc._type
              // If the type exists add the document to it.
              if (acc[type]) acc[type].push(doc)
              // else, create the type with the document.
              else acc[type] = [doc]
              return acc
            },
            {} as Record<string, SanityDocument[]>,
          )
          return Object.entries(documentsByType).map(([type, docs]) => ({type, documents: docs}))
        }),
        map((list) => ({list, loading: false})),
      ),
    [documentId, documentPreviewStore, getClient],
  )
  const references = useObservable(references$, null)

  const crossDatasetIncomingRefs$ = useMemo(
    () =>
      getCrossDatasetIncomingReferences({documentId, client, documentPreviewStore}).pipe(
        map(({documents}) => {
          const documentsByType = documents.reduce(
            (acc, doc) => {
              const type = doc.type
              // If the type exists add the document to it.
              if (acc[type]) acc[type].push(doc)
              // else, create the type with the document.
              else acc[type] = [doc]
              return acc
            },
            {} as Record<string, CrossDatasetIncomingReferenceDocument[]>,
          )
          return Object.entries(documentsByType).map(([type, docs]) => ({type, documents: docs}))
        }),
        map((list) => ({list, loading: false})),
      ),
    [client, documentId, documentPreviewStore],
  )

  const crossDatasetRefs = useObservable(crossDatasetIncomingRefs$, null)

  return (
    <>
      {references?.loading ? (
        <LoadingBlock showText title={t('incoming-references-input.types-loading')} />
      ) : (
        references?.list.map(({type, documents}) => {
          return (
            <Stack key={type} padding={2} space={1} marginBottom={2}>
              <TypeTitle type={type} />
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
                        {t('incoming-references-pane.no-references-found')}
                      </Text>
                    </Box>
                  </Card>
                </Box>
              )}
            </Stack>
          )
        })
      )}
      {crossDatasetRefs?.loading ? (
        <LoadingBlock showText title={t('incoming-references-input.types-loading-cross-dataset')} />
      ) : (
        crossDatasetRefs?.list.map(({type, documents}) => {
          return (
            <Stack key={type} padding={2} space={1} marginBottom={2}>
              <TypeTitle type={type} />
              {documents.map((document) => (
                <Card
                  key={document.id}
                  border
                  radius={2}
                  padding={1}
                  tone="default"
                  overflow="hidden"
                >
                  <CrossDatasetIncomingReferenceDocumentPreview document={document} />
                </Card>
              ))}
            </Stack>
          )
        })
      )}
    </>
  )
}
