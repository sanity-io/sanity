import {type SchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {Suspense, use, useCallback, useMemo} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {
  CommandList,
  type CommandListRenderItemCallback,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  LoadingBlock,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useTranslation,
} from 'sanity'
import {Flex, Box} from 'ui5'

import {structureLocaleNamespace} from '../../../i18n'
import {INCOMING_REFERENCES_ITEM_HEIGHT, IncomingReferencesListContainer} from '../shared'
import {type CrossDatasetIncomingReference} from '../types'
import {CrossDatasetIncomingReferenceDocumentPreview} from './CrossDatasetIncomingReferenceDocumentPreview'
import {
  type CrossDatasetIncomingReferenceDocument,
  getCrossDatasetIncomingReferences,
} from './getCrossDatasetIncomingReferences'

export function CrossDatasetIncomingReferenceType({
  type,
  referenced,
  shouldRenderTitle,
}: {
  shouldRenderTitle: boolean
  referenced: {id: string; type: string}
  type: CrossDatasetIncomingReference
}) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentPreviewStore = useDocumentPreviewStore()

  const references$ = useMemo(
    () =>
      getCrossDatasetIncomingReferences({
        documentId: referenced.id,
        client,
        type: type,
        documentPreviewStore,
      }),
    [client, type, referenced.id, documentPreviewStore],
  )

  const referencesPromise = useObservablePromise(references$)

  const schema = useSchema()
  const {t} = useTranslation(structureLocaleNamespace)
  const schemaType = schema.get(type.type)

  if (!schemaType) return null
  return (
    <Suspense
      fallback={
        <LoadingBlock showText title={t('incoming-references-input.types-loading-cross-dataset')} />
      }
    >
      <CrossDatasetIncomingReferenceTypeList
        referencesPromise={referencesPromise}
        schemaType={schemaType}
        shouldRenderTitle={shouldRenderTitle}
        type={type}
      />
    </Suspense>
  )
}

function CrossDatasetIncomingReferenceTypeList({
  type,
  shouldRenderTitle,
  referencesPromise,
  schemaType,
}: {
  shouldRenderTitle: boolean
  type: CrossDatasetIncomingReference
  referencesPromise: ObservablePromise<CrossDatasetIncomingReferenceDocument[]>
  schemaType: SchemaType
}) {
  const documents = use(referencesPromise)

  const {t} = useTranslation(structureLocaleNamespace)

  const renderItem = useCallback<
    CommandListRenderItemCallback<CrossDatasetIncomingReferenceDocument>
  >(
    (document) => <CrossDatasetIncomingReferenceDocumentPreview document={document} type={type} />,
    [type],
  )

  return (
    <Stack gap={2} marginBottom={2}>
      {shouldRenderTitle && (
        <Box paddingY={2} paddingX={0}>
          <Text size={1} weight="medium">
            {type.title || schemaType?.title}
          </Text>
        </Box>
      )}
      <Card radius={2} padding={1} border tone="default">
        {documents && documents.length > 0 ? (
          <IncomingReferencesListContainer $itemCount={documents.length}>
            <CommandList
              activeItemDataAttr="data-hovered"
              ariaLabel={t('incoming-references-input.list-label', {
                type: type.title || schemaType?.title,
              })}
              canReceiveFocus
              fixedHeight
              getItemKey={(index) => documents[index].id}
              itemHeight={INCOMING_REFERENCES_ITEM_HEIGHT}
              items={documents}
              onlyShowSelectionWhenActive
              overscan={5}
              renderItem={renderItem}
              wrapAround={false}
            />
          </IncomingReferencesListContainer>
        ) : (
          <>
            <Flex alignItems="center" justifyContent="center" padding={2}>
              <Text size={1} muted>
                {t('incoming-references-input.no-items')}
              </Text>
            </Flex>
          </>
        )}
      </Card>
    </Stack>
  )
}
