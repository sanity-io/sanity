import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {LoadingBlock, RelativeTime} from '../../../components'
import {useTranslation} from '../../../i18n'
import {EditVariantDialog} from '../../components/dialog/EditVariantDialog'
import {useVariantDocuments} from '../../hooks/useVariantDocuments'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {VariantPinButton} from '../components/VariantPinButton'
import {
  decodeVariantIdFromRoute,
  getVariantConditionsText,
  getVariantDescription,
  getVariantId,
  getVariantTitle,
} from '../util'
import {groupVariantDocumentsByGroup} from './groupVariantDocumentsByGroup'
import {VariantDetailMenuButton} from './VariantDetailMenuButton'
import {VariantDocumentsTable} from './VariantDocumentsTable'

// Thin vertical rule separating the inline metadata segments in the header lane.
function HeaderDivider() {
  return <Card borderLeft flex="none" style={{height: 20}} />
}

export function VariantDetail() {
  const router = useRouter()
  const {t} = useTranslation(variantsLocaleNamespace)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const variantIdRaw =
    typeof router.state.variantId === 'string' ? router.state.variantId : undefined
  const variantId = decodeVariantIdFromRoute(variantIdRaw)
  const {byId, loading} = useAllVariants()

  const variant = variantId ? byId.get(variantId) : undefined
  const {
    loading: documentsLoading,
    results: variantDocuments,
    error: variantDocumentsError,
  } = useVariantDocuments(variant?._id)

  const tableRows = useMemo(
    () => groupVariantDocumentsByGroup(variantDocuments),
    [variantDocuments],
  )

  if (loading) {
    return <LoadingBlock fill title={t('detail.loading')} />
  }

  if (!variant) {
    return (
      <Flex direction="column" flex={1} height="fill">
        <Card borderBottom flex="none" padding={3}>
          <Button
            icon={ArrowLeftIcon}
            mode="ghost"
            onClick={() => router.navigate({})}
            text={t('detail.back')}
          />
        </Card>
        <Box padding={4}>
          <Card border padding={4} radius={3}>
            <Stack space={3}>
              <Text size={2} weight="semibold">
                {t('detail.not-found.title')}
              </Text>
              <Text muted size={1}>
                {t('detail.not-found.description')}
              </Text>
            </Stack>
          </Card>
        </Box>
      </Flex>
    )
  }

  const description = getVariantDescription(variant)
  const conditionsText = getVariantConditionsText(variant.conditions)

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden">
      <Card borderBottom flex="none" padding={3}>
        <Button
          icon={ArrowLeftIcon}
          mode="ghost"
          onClick={() => router.navigate({})}
          text={t('detail.back')}
        />
      </Card>
      {/* Slim header lane: identity + inline metadata on the left, actions on the right, so the
          vertical space goes to the documents table below instead of a tall stacked header. */}
      <Card borderBottom flex="none" paddingX={4} paddingY={3}>
        <Flex align="center" gap={3}>
          <Flex align="center" gap={3} flex={1} style={{minWidth: 0}}>
            <Flex align="center" gap={2} flex="none">
              <VariantPinButton variant={variant} />
              <Text as="h1" size={2} textOverflow="ellipsis" weight="bold">
                {getVariantTitle(variant)}
              </Text>
            </Flex>
            <HeaderDivider />
            <Text muted size={1} style={{minWidth: 0}} textOverflow="ellipsis">
              {conditionsText || t('overview.table.no-conditions')}
            </Text>
            {description && (
              <>
                <HeaderDivider />
                <Text muted size={1} style={{minWidth: 0}} textOverflow="ellipsis">
                  {description}
                </Text>
              </>
            )}
          </Flex>
          <Flex align="center" data-testid="variant-detail-actions" flex="none" gap={3}>
            <Text muted size={1}>
              {t('detail.footer.created')}{' '}
              <RelativeTime minimal time={variant._createdAt} useTemporalPhrase />
            </Text>
            <Button
              onClick={() => setEditDialogOpen(true)}
              text={t('detail.action.edit-variant')}
            />
            <VariantDetailMenuButton
              documentCount={tableRows.length}
              documentsLoading={documentsLoading}
              variant={variant}
            />
          </Flex>
        </Flex>
      </Card>
      <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
        {variantDocumentsError ? (
          <Box padding={4}>
            <Text muted size={1}>
              {t('detail.documents.error')}
            </Text>
          </Box>
        ) : (
          <VariantDocumentsTable
            loading={documentsLoading}
            rows={tableRows}
            variantId={getVariantId(variant._id)}
          />
        )}
      </Flex>
      {editDialogOpen && (
        <EditVariantDialog
          onCancel={() => setEditDialogOpen(false)}
          onSubmit={() => setEditDialogOpen(false)}
          variant={variant}
        />
      )}
    </Flex>
  )
}
