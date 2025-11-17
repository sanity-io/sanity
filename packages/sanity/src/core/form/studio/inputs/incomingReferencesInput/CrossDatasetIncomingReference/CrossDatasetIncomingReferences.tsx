import {type CrossDatasetIncomingReference} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {LoadingBlock} from '../../../../../components/loadingBlock/LoadingBlock'
import {useClient} from '../../../../../hooks/useClient'
import {useSchema} from '../../../../../hooks/useSchema'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useDocumentPreviewStore} from '../../../../../store/_legacy/datastores'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {INITIAL_STATE} from '../getIncomingReferences'
import {getCrossDatasetIncomingReferences} from './getCrossDatasetIncomingReferences'
import {IncomingReferenceCrossDatasetPreview} from './IncomingReferenceCrossDatasetPreview'

export function CrossDatasetIncomingReferences({
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
  const {t} = useTranslation()
  const schemaType = schema.get(type.type)

  if (!schemaType) return null
  if (loading) {
    return <LoadingBlock showText title={t('incoming-references.input.types-loading')} />
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
            {documents.map((document) => (
              <IncomingReferenceCrossDatasetPreview
                key={document.id}
                document={document}
                type={type}
              />
            ))}
          </Stack>
        ) : (
          <>
            <Flex align="center" justify="center" padding={2}>
              <Text size={1} muted>
                {t('incoming-references.input.no-items')}
              </Text>
            </Flex>
          </>
        )}
      </Card>
    </Stack>
  )
}
