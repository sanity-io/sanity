import {type SanityDocument} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'
import {
  CommandList,
  type CommandListRenderItemCallback,
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
import {
  INCOMING_REFERENCES_ITEM_HEIGHT,
  IncomingReferencesListContainer,
} from '../../../../components/incomingReferencesDecoration/shared'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {IncomingReferenceDocument} from './IncomingReferenceDocument'

interface TypeSectionProps<T> {
  type: string
  documents: T[]
  renderItem: CommandListRenderItemCallback<T>
  getItemKey: (index: number) => string
  emptyMessage: string
}

function TypeSection<T>({
  type,
  documents,
  renderItem,
  getItemKey,
  emptyMessage,
}: TypeSectionProps<T>) {
  const schema = useSchema()
  const {t} = useTranslation(structureLocaleNamespace)
  const schemaType = schema.get(type)
  const title = schemaType?.title || type

  return (
    <Stack key={type} padding={2} space={1} marginBottom={2}>
      <Flex align="center" justify="space-between" paddingBottom={2} gap={2}>
        <Box padding={2}>
          <Text size={1} weight="medium">
            {title}
          </Text>
        </Box>
      </Flex>
      {documents.length > 0 ? (
        <Card radius={2} padding={1} border tone="default">
          <IncomingReferencesListContainer $itemCount={documents.length}>
            <CommandList
              activeItemDataAttr="data-hovered"
              ariaLabel={t('incoming-references-input.list-label', {type: title})}
              canReceiveFocus
              fixedHeight
              getItemKey={getItemKey}
              itemHeight={INCOMING_REFERENCES_ITEM_HEIGHT}
              items={documents}
              onlyShowSelectionWhenActive
              overscan={5}
              renderItem={renderItem}
              wrapAround={false}
            />
          </IncomingReferencesListContainer>
        </Card>
      ) : (
        <Box padding={0}>
          <Card border radius={3} padding={1} tone="default">
            <Box paddingY={3} paddingX={2}>
              <Text size={1} muted>
                {emptyMessage}
              </Text>
            </Box>
          </Card>
        </Box>
      )}
    </Stack>
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

  const renderSameDatasetItem = useCallback<CommandListRenderItemCallback<SanityDocument>>(
    (document) => <IncomingReferenceDocument document={document} referenceToId={documentId} />,
    [documentId],
  )

  const renderCrossDatasetItem = useCallback<
    CommandListRenderItemCallback<CrossDatasetIncomingReferenceDocument>
  >((document) => <CrossDatasetIncomingReferenceDocumentPreview document={document} />, [])

  const emptyMessage = t('incoming-references-pane.no-references-found')

  return (
    <>
      {references?.loading ? (
        <LoadingBlock showText title={t('incoming-references-input.types-loading')} />
      ) : (
        references?.list.map(({type, documents}) => (
          <TypeSection
            key={type}
            type={type}
            documents={documents}
            renderItem={renderSameDatasetItem}
            getItemKey={(index) => documents[index]._id}
            emptyMessage={emptyMessage}
          />
        ))
      )}
      {crossDatasetRefs?.loading ? (
        <LoadingBlock showText title={t('incoming-references-input.types-loading-cross-dataset')} />
      ) : (
        crossDatasetRefs?.list.map(({type, documents}) => (
          <TypeSection
            key={type}
            type={type}
            documents={documents}
            renderItem={renderCrossDatasetItem}
            getItemKey={(index) => documents[index].id}
            emptyMessage={emptyMessage}
          />
        ))
      )}
    </>
  )
}
