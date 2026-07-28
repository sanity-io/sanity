import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {
  DocumentTable,
  type DocumentTableSelection,
} from '../../../releases/tool/components/Table/DocumentTable'
import {CreateVariantDialog} from '../../components/dialog/CreateVariantDialog'
import {useVariantsDocumentCounts} from '../../hooks/useVariantsDocumentCounts'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {type SystemVariant} from '../../types'
import {filterVariantsForSearch, getVariantId} from '../util'
import {VariantBulkDeleteDialog} from './VariantBulkDeleteDialog'
import {VariantMenuButton} from './VariantMenuButton'
import {VariantsEmptyState} from './VariantsEmptyState'
import {type TableVariant, variantsOverviewColumnDefs} from './VariantsOverviewColumnDefs'

const VARIANT_TABLE_ROW_ID = '_id'
const getRowKey = (variant: TableVariant): string => variant._id
// DocumentTable filters internally per-row; reuse the list matcher on a single-element list so the
// search behaviour stays identical to the previous standalone search box.
const searchPredicate = (variant: TableVariant, term: string): boolean =>
  filterVariantsForSearch([variant], term).length > 0

export function VariantsOverview(): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const router = useRouter()
  const {data: variants, error, loading} = useAllVariants()
  const [isCreateVariantDialogOpen, setIsCreateVariantDialogOpen] = useState(false)
  const [bulkDelete, setBulkDelete] = useState<{keys: string[]; clear: () => void} | null>(null)

  const handleCreateVariant = useCallback(() => setIsCreateVariantDialogOpen(true), [])

  const handleOnCreateVariant = useCallback(
    (createdVariantId: string) => {
      setIsCreateVariantDialogOpen(false)
      router.navigate({variantId: getVariantId(createdVariantId)})
    },
    [router],
  )

  const columnDefs = useMemo(() => variantsOverviewColumnDefs(t), [t])

  const renderRowActions = useCallback(
    ({datum}: {datum: unknown}) => (
      <VariantMenuButton
        documentCount={(datum as TableVariant).documentCount}
        variant={datum as SystemVariant}
      />
    ),
    [],
  )

  const variantsList = useMemo(() => variants ?? [], [variants])
  const {data: documentCounts, error: documentCountsError} = useVariantsDocumentCounts()

  // All variants (unfiltered) — DocumentTable owns the search filtering via searchPredicate.
  const rows = useMemo(
    () =>
      variantsList.map(
        (variant): TableVariant => ({
          ...variant,
          documentCount: documentCounts?.[variant._id] ?? (documentCountsError ? null : undefined),
        }),
      ),
    [variantsList, documentCounts, documentCountsError],
  )

  const hasVariants = variantsList.length > 0

  const createVariantButton = useMemo(
    () => (
      <Button
        disabled={isCreateVariantDialogOpen}
        icon={AddIcon}
        onClick={handleCreateVariant}
        text={t('overview.action.create-variant')}
      />
    ),
    [handleCreateVariant, isCreateVariantDialogOpen, t],
  )

  // Bulk selection + a single destructive action. The delete itself is guarded per-definition in the
  // dialog (only empty definitions are removed), so the toolbar keeps one clear "Delete" affordance.
  const selection = useMemo<DocumentTableSelection>(
    () => ({
      labels: {
        selectAll: t('overview.bulk.select-all'),
        selectRow: t('overview.bulk.select-row'),
        selectedCount: (count) => t('overview.bulk.selected', {count}),
        clear: t('overview.bulk.clear'),
      },
      selectAllTestId: 'variant-bulk-select-all',
      renderActions: ({selectedKeys, clear}) => (
        <Button
          data-testid="variant-bulk-delete"
          icon={TrashIcon}
          mode="bleed"
          onClick={() => setBulkDelete({keys: selectedKeys, clear})}
          text={t('overview.bulk.delete')}
          tone="critical"
        />
      ),
    }),
    [t],
  )

  const tableEmptyState = useCallback(() => {
    if (error && !hasVariants) {
      return (
        <Flex align="center" direction="column" gap={3} justify="center" padding={4}>
          <Text muted size={1}>
            {t('overview.error')}
          </Text>
        </Flex>
      )
    }

    return <VariantsEmptyState createVariantButton={createVariantButton} />
  }, [createVariantButton, error, hasVariants, t])

  const selectedVariants = useMemo(() => {
    if (!bulkDelete) return []
    const keys = new Set(bulkDelete.keys)
    return rows.filter((variant) => keys.has(variant._id))
  }, [bulkDelete, rows])

  return (
    <Flex direction="column" flex={1} height="fill">
      {/* Same container width as the releases document table (`container[3]`), so the page header
          aligns with the table's row content below. */}
      <Container flex="none" width={3}>
        <Flex direction="column" paddingX={3}>
          <Card flex="none" paddingY={5}>
            <Flex align="flex-start" gap={4} justify="space-between">
              <Stack space={3}>
                <Text as="h1" size={4} weight="bold">
                  {t('overview.title')}
                </Text>
                <Text muted size={1}>
                  {t('overview.description')}
                </Text>
              </Stack>
              {createVariantButton}
            </Flex>
          </Card>

          {error && (
            <Card flex="none" marginBottom={4} padding={3} tone="critical">
              <Text size={1}>{t('overview.error')}</Text>
            </Card>
          )}
        </Flex>
      </Container>

      {/* Shared DocumentTable — the same table the release and variant detail surfaces use: search in
          the command lane, checkbox selection, and a bulk toolbar on selection. */}
      <DocumentTable<TableVariant>
        columnDefs={columnDefs}
        emptyState={tableEmptyState}
        getRowKey={getRowKey}
        id="variant-definitions-table"
        loading={loading}
        rowActions={renderRowActions}
        rowId={VARIANT_TABLE_ROW_ID}
        rows={rows}
        searchPlaceholder={t('overview.search.placeholder')}
        searchPredicate={searchPredicate}
        selection={selection}
      />

      {isCreateVariantDialogOpen && (
        <CreateVariantDialog
          onCancel={() => setIsCreateVariantDialogOpen(false)}
          onSubmit={handleOnCreateVariant}
        />
      )}

      {bulkDelete && (
        <VariantBulkDeleteDialog
          onClose={() => setBulkDelete(null)}
          onDeleted={() => bulkDelete.clear()}
          variants={selectedVariants}
        />
      )}
    </Flex>
  )
}
