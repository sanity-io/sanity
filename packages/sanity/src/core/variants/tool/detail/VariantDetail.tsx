import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {ClockIcon} from '@sanity/icons/Clock'
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
import {
  decodeVariantIdFromRoute,
  getVariantDescription,
  getVariantId,
  getVariantTitle,
} from '../util'
import {groupVariantDocumentsByGroup} from './groupVariantDocumentsByGroup'
import {DETAIL_CONTENT_CENTER_STYLE} from './types'
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

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden">
      {/* Slim header lane: back control + identity + inline metadata on the left, actions on the
          right. The back arrow is merged in here (a leading icon button) rather than sitting in its
          own full-width lane, so all the vertical space goes to the documents table below. */}
      <Card borderBottom flex="none" paddingX={4} paddingY={3}>
        {/* Centered at the shared content width so the header lines up with the table below and
            doesn't spread edge-to-edge on wide screens (which reads as too wide / hard to scan). */}
        <Box style={DETAIL_CONTENT_CENTER_STYLE}>
          <Flex align="center" gap={3}>
            <Flex align="center" gap={3} flex={1} style={{minWidth: 0}}>
              <Button
                aria-label={t('detail.back')}
                icon={ArrowLeftIcon}
                mode="bleed"
                onClick={() => router.navigate({})}
                tooltipProps={{content: t('detail.back')}}
              />
              {/* The variant "pin" (adopt-this-perspective) control was removed here deliberately:
                selecting a variant is a *global authoring mode* (it re-targets every document edit
                to the variant version — see useDocumentForm/useTargetDocumentState), which belongs in
                global perspective-bar chrome, not on this definition-management surface. The correct
                icon + behavior return once the perspective-bar initiative lands (FH tracked). */}
              <Flex align="center" flex="none">
                <Text as="h1" size={2} textOverflow="ellipsis" weight="bold">
                  {getVariantTitle(variant)}
                </Text>
              </Flex>
              <HeaderDivider />
              {Object.keys(variant.conditions).length > 0 ? (
                // Conditions are read-only facts, not interactive chips — render them as quiet
                // key/value metadata (muted key, solid value, dot-separated) so they're visually
                // distinct from the lineage *status* badges further along the lane.
                <Flex align="center" flex="none" gap={3} wrap="wrap">
                  {Object.entries(variant.conditions).map(([key, value], index) => (
                    <Flex align="center" gap={2} key={key}>
                      {index > 0 && (
                        <Text aria-hidden muted size={1}>
                          ·
                        </Text>
                      )}
                      <Flex align="center" gap={1}>
                        <Text muted size={1}>
                          {key}
                        </Text>
                        <Text size={1} weight="medium">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Flex>
              ) : (
                <Text muted size={1}>
                  {t('overview.table.no-conditions')}
                </Text>
              )}
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
              <Flex align="center" gap={2}>
                <Text muted size={1}>
                  <ClockIcon />
                </Text>
                <Text muted size={1}>
                  {t('detail.footer.created')}{' '}
                  <RelativeTime minimal time={variant._createdAt} useTemporalPhrase />
                </Text>
              </Flex>
              <HeaderDivider />
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
        </Box>
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
