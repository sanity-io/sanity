import {DocumentsIcon} from '@sanity/icons/Documents'
import {EditIcon} from '@sanity/icons/Edit'
import {UserIcon} from '@sanity/icons/User'
import {Box, Card, Container, Flex, Skeleton, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {LoadingBlock, RelativeTime} from '../../../components'
import {
  DetailBackButton,
  DetailIdentity,
  DetailPropertiesPanel,
  type DetailPropertiesSection,
} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n'
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
import {VariantActionRail} from './VariantActionRail'
import {getVariantConditionIcon} from './variantConditionIcons'
import {VariantDocumentsTable} from './VariantDocumentsTable'

export function VariantDetail() {
  const router = useRouter()
  const {t} = useTranslation(variantsLocaleNamespace)
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

  // "Unpublished changes" = document groups that carry a draft version. Counted separately from the
  // total (a group can hold both a published and a draft version), so the two numbers each answer a
  // distinct question — "how many documents" vs "how many have pending changes" — without implying
  // they partition the total.
  const unpublishedCount = useMemo(
    () =>
      tableRows.filter((row) => row.versions.some((version) => version.bundleId === 'drafts'))
        .length,
    [tableRows],
  )

  // Two short, side-by-side panels rather than one tall stacked one: one about the variant
  // definition itself (its targeting conditions + when it was created), one about the documents it
  // holds. Same bordered pattern, split along a semantic seam ("what defines it" vs "what's in it").
  const definitionSections = useMemo<DetailPropertiesSection[]>(() => {
    if (!variant) return []

    const conditionEntries = Object.entries(variant.conditions)
    const conditionRows =
      conditionEntries.length > 0
        ? conditionEntries.map(([key, value]) => {
            // Each targeting dimension gets a recognizable glyph (audience → people, location →
            // pin, …) so a multi-dimension definition reads at a glance.
            const DimensionIcon = getVariantConditionIcon(key)
            return {
              icon: (
                <Text muted size={1}>
                  <DimensionIcon />
                </Text>
              ),
              label: key,
              value,
            }
          })
        : [
            {
              label: '',
              value: (
                <Text muted size={1}>
                  {t('overview.table.no-conditions')}
                </Text>
              ),
            },
          ]

    return [
      {
        title: t('detail.metadata.definition'),
        // Split the conditions into two columns once a definition carries several, so a 5-6 dimension
        // definition reads as a compact block rather than a tall stack — keeping it closer to the
        // fixed-height Documents panel beside it.
        multiColumn: true,
        rows: [
          ...conditionRows,
          {
            // Created is provenance, not a targeting condition: `fullWidth` keeps it out of the
            // two-column split so the conditions balance evenly and Created sits on its own line
            // just below them (rather than as an odd extra cell, or detached in its own section). A
            // person glyph (not a clock — a clock reads as "time/schedule"). The author identity
            // isn't on the variant document yet, so this shows the relative time for now; wiring the
            // creator's name/avatar is a follow-up.
            fullWidth: true,
            icon: (
              <Text muted size={1}>
                <UserIcon />
              </Text>
            ),
            label: t('detail.footer.created'),
            value: (
              <Text size={1}>
                <RelativeTime minimal time={variant._createdAt} useTemporalPhrase />
              </Text>
            ),
          },
        ],
      },
    ]
  }, [t, variant])

  const documentSections = useMemo<DetailPropertiesSection[]>(() => {
    // While documents are still streaming in, show a skeleton rather than "0" — a literal 0
    // mid-load reads as "empty" when the real count just hasn't arrived yet.
    const countValue = (count: number): React.ReactNode =>
      documentsLoading ? (
        <Skeleton animated radius={1} style={{width: 24, height: 11}} />
      ) : (
        String(count)
      )

    return [
      {
        title: t('detail.metadata.documents'),
        rows: [
          {
            icon: (
              <Text muted size={1}>
                <DocumentsIcon />
              </Text>
            ),
            label: t('detail.metadata.total'),
            value: countValue(tableRows.length),
          },
          {
            icon: (
              <Text muted size={1}>
                <EditIcon />
              </Text>
            ),
            label: t('detail.metadata.unpublished-changes'),
            value: countValue(unpublishedCount),
          },
        ],
      },
    ]
  }, [documentsLoading, t, tableRows.length, unpublishedCount])

  if (loading) {
    return <LoadingBlock fill title={t('detail.loading')} />
  }

  if (!variant) {
    return (
      <Flex direction="column" flex={1} height="fill">
        <Card borderBottom flex="none" padding={3}>
          <DetailBackButton onClick={() => router.navigate({})} text={t('detail.back')} />
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
      {/* Header region — the shared detail spine: a top rail (back on the left, action rail on the
          right), then a two-zone body (identity on the left, a bordered properties panel on the
          right). Matches the Releases detail page so the two read as one family. The borderBottom
          separates the whole region from the documents table below. */}
      <Card borderBottom flex="none" paddingY={3}>
        {/* container[3] so the header aligns with the table's row content below (the shared Table
            centers rows at container[3]) instead of spreading edge-to-edge on wide screens. */}
        <Container flex="none" width={3}>
          {/* paddingX={2} (8px) matches the table's first-column content inset so the back button and
              actions line up with the row content below. */}
          <Box paddingX={2}>
            <Stack space={4}>
              <Flex align="center" gap={3}>
                <Flex align="center" flex={1} style={{minWidth: 0}}>
                  <DetailBackButton
                    onClick={() => router.navigate({})}
                    testId="back-to-variants-button"
                    text={t('detail.back')}
                  />
                </Flex>
                <Flex data-testid="variant-detail-actions" flex="none">
                  <VariantActionRail
                    documentCount={tableRows.length}
                    documentsLoading={documentsLoading}
                    variant={variant}
                  />
                </Flex>
              </Flex>
              <Flex align="flex-start" gap={4} wrap="wrap">
                <Box flex={1} style={{minWidth: 280}}>
                  <DetailIdentity
                    description={description || undefined}
                    descriptionTestId="variant-description-display"
                    title={getVariantTitle(variant)}
                    titleAs="h1"
                    titlePlaceholder={t('overview.table.variant')}
                    titleTestId="variant-title-display"
                  />
                </Box>
                <Flex align="flex-start" flex="none" gap={4} wrap="wrap">
                  <DetailPropertiesPanel
                    maxWidth={480}
                    sections={definitionSections}
                    testId="variant-detail-definition"
                  />
                  <DetailPropertiesPanel
                    sections={documentSections}
                    testId="variant-detail-documents"
                  />
                </Flex>
              </Flex>
            </Stack>
          </Box>
        </Container>
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
    </Flex>
  )
}
