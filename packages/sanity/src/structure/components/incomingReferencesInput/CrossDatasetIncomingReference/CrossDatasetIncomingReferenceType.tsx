/* eslint-disable react-hooks/preserve-manual-memoization */
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  createDocumentPreviewStore,
  CrossDatasetReferencePreview,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  LoadingBlock,
  PreviewCard,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../../i18n'
import {INITIAL_STATE} from '../getIncomingReferences'
import {type CrossDatasetIncomingReference} from '../types'
import {getCrossDatasetIncomingReferences} from './getCrossDatasetIncomingReferences'

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
  const projectId = client.config().projectId || ''
  const crossDatasetClient = useMemo(
    () => client.withConfig({dataset: type.dataset, ignoreBrowserTokenWarning: true}).clone(),
    [client, type.dataset],
  )
  const crossDatasetDocumentPreviewStore = useMemo(
    () => createDocumentPreviewStore({client: crossDatasetClient}),
    [crossDatasetClient],
  )

  const references$ = useMemo(
    () =>
      getCrossDatasetIncomingReferences({
        documentId: referenced.id,
        client,
        type: type,
        documentPreviewStore: crossDatasetDocumentPreviewStore,
      }),
    [client, type, referenced.id, crossDatasetDocumentPreviewStore],
  )

  const {documents, loading} = useObservable(references$, INITIAL_STATE)

  const schema = useSchema()
  const {t} = useTranslation(structureLocaleNamespace)
  const schemaType = schema.get(type.type)

  if (!schemaType) return null
  if (loading) {
    return <LoadingBlock showText title={'Loading documents'} />
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
          <Stack space={1}>
            {documents.map((document) => {
              const studioUrl = type.studioUrl?.({id: document.id, type: document.type})
              return (
                <Flex key={document.id} gap={1} align="center">
                  <Box flex={1}>
                    {/* In some cases when the document has been recently linked the value we get 
                 in the listener is not the latest, but a previous value with the document not yet linked, this handles that */}
                    <PreviewCard
                      data-as={studioUrl ? 'a' : 'div'}
                      flex={1}
                      padding={1}
                      paddingRight={3}
                      radius={2}
                      tone="inherit"
                      __unstable_focusRing
                      tabIndex={0}
                      onFocus={() => {}}
                      onBlur={() => {}}
                      {...(studioUrl
                        ? {href: studioUrl, target: '_blank', rel: 'noopener noreferrer', as: 'a'}
                        : {})}
                    >
                      <CrossDatasetReferencePreview
                        availability={document.availability}
                        hasStudioUrl={Boolean(studioUrl)}
                        showStudioUrlIcon={Boolean(studioUrl)}
                        preview={document.preview}
                        refType={{
                          type: type.type,
                          title: document.preview.published?.title,
                          icon: () => null,
                          preview: type.preview,
                        }}
                        projectId={projectId}
                        dataset={type.dataset}
                        id={document.id}
                        showTypeLabel={false}
                      />
                    </PreviewCard>
                  </Box>
                </Flex>
              )
            })}
          </Stack>
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
