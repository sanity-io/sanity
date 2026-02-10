import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
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

import {structureLocaleNamespace} from '../../../i18n'
import {INITIAL_STATE} from '../getIncomingReferences'
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

  const {documents, loading} = useObservable(references$, INITIAL_STATE)

  const schema = useSchema()
  const {t} = useTranslation(structureLocaleNamespace)
  const schemaType = schema.get(type.type)

  const renderItem = useCallback<
    CommandListRenderItemCallback<CrossDatasetIncomingReferenceDocument>
  >(
    (document) => <CrossDatasetIncomingReferenceDocumentPreview document={document} type={type} />,
    [type],
  )

  if (!schemaType) return null
  if (loading) {
    return <LoadingBlock showText title={t('incoming-references-input.types-loading')} />
  }
  return (
    <Stack space={2} marginBottom={2}>
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
            <Flex align="center" justify="center" padding={2}>
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
