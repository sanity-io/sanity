import {type SanityDocument} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {Suspense, use, useCallback, useMemo} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
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
import {Box} from 'ui5'

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
import {useDocumentPaneInfo} from '../../useDocumentPaneInfo'
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
    <Stack key={type} padding={2} gap={1} marginBottom={2}>
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

function groupByType<Doc>(documents: Doc[], getType: (doc: Doc) => string) {
  // Group with a Map rather than a plain object: type names are user-defined,
  // so keys like "__proto__" must not collide with object prototype members.
  const documentsByType = new Map<string, Doc[]>()
  for (const doc of documents) {
    const type = getType(doc)
    const group = documentsByType.get(type)
    if (group) group.push(doc)
    else documentsByType.set(type, [doc])
  }
  return Array.from(documentsByType, ([type, docs]) => ({type, documents: docs}))
}

export function IncomingReferencesList() {
  const {documentId} = useDocumentPaneInfo()
  const {t} = useTranslation(structureLocaleNamespace)
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {getClient} = useSource()
  const documentPreviewStore = useDocumentPreviewStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const references$ = useMemo(
    () =>
      getIncomingReferences({
        documentId,
        documentPreviewStore,
        getClient,
      }).pipe(map((documents) => groupByType(documents, (doc) => doc._type))),
    [documentId, documentPreviewStore, getClient],
  )
  const referencesPromise = useObservablePromise(references$)

  const crossDatasetIncomingRefs$ = useMemo(
    () =>
      getCrossDatasetIncomingReferences({documentId, client, documentPreviewStore}).pipe(
        map((documents) => groupByType(documents, (doc) => doc.type)),
      ),
    [client, documentId, documentPreviewStore],
  )
  const crossDatasetRefsPromise = useObservablePromise(crossDatasetIncomingRefs$)

  return (
    <Suspense
      fallback={<LoadingBlock showText title={t('incoming-references-input.types-loading')} />}
    >
      <LoadedIncomingReferencesList
        crossDatasetRefsPromise={crossDatasetRefsPromise}
        documentId={documentId}
        referencesPromise={referencesPromise}
      />
    </Suspense>
  )
}

function LoadedIncomingReferencesList({
  documentId,
  referencesPromise,
  crossDatasetRefsPromise,
}: {
  documentId: string
  referencesPromise: ObservablePromise<Array<{type: string; documents: SanityDocument[]}>>
  crossDatasetRefsPromise: ObservablePromise<
    Array<{type: string; documents: CrossDatasetIncomingReferenceDocument[]}>
  >
}) {
  // Both requests run in parallel — they start when the parent creates the
  // promises, and this component waits for the slower of the two.
  const references = use(referencesPromise)
  const crossDatasetRefs = use(crossDatasetRefsPromise)

  const {t} = useTranslation(structureLocaleNamespace)

  const renderSameDatasetItem = useCallback<CommandListRenderItemCallback<SanityDocument>>(
    (document) => <IncomingReferenceDocument document={document} referenceToId={documentId} />,
    [documentId],
  )

  const renderCrossDatasetItem = useCallback<
    CommandListRenderItemCallback<CrossDatasetIncomingReferenceDocument>
  >((document) => <CrossDatasetIncomingReferenceDocumentPreview document={document} />, [])

  const emptyMessage = t('incoming-references-pane.no-references-found')

  const showEmptyState = references.length === 0 && crossDatasetRefs.length === 0

  return (
    <>
      {showEmptyState && (
        <Card border radius={3} padding={1} tone="default">
          <Box paddingY={3} paddingX={2}>
            <Text size={1} muted>
              {t('incoming-references-pane.no-references')}
            </Text>
          </Box>
        </Card>
      )}
      {references.map(({type, documents}) => (
        <TypeSection
          key={type}
          type={type}
          documents={documents}
          renderItem={renderSameDatasetItem}
          getItemKey={(index) => documents[index]._id}
          emptyMessage={emptyMessage}
        />
      ))}
      {crossDatasetRefs.map(({type, documents}) => (
        <TypeSection
          key={type}
          type={type}
          documents={documents}
          renderItem={renderCrossDatasetItem}
          getItemKey={(index) => documents[index].id}
          emptyMessage={emptyMessage}
        />
      ))}
    </>
  )
}
