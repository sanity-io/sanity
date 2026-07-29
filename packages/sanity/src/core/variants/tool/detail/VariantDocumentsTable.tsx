import {AddIcon} from '@sanity/icons/Add'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Flex, Menu, MenuDivider, Stack, Text, useToast} from '@sanity/ui'
import {Fragment, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspective} from '../../../perspective/usePerspective'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {
  DocumentTable,
  type DocumentTableSelection,
} from '../../../releases/tool/components/Table/DocumentTable'
import {type Column} from '../../../releases/tool/components/Table/types'
import {searchDocumentRelease} from '../../../releases/tool/detail/documentTable/searchDocumentRelease'
import {useVariantDocumentOperations} from '../../hooks/useVariantDocumentOperations'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId} from '../util'
import {computeReleaseLaneSegments, RELEASE_LANE_ALL, rowMatchesLane} from './releaseLane'
import {type DocumentInVariantGroup} from './types'
import {
  VariantAddDocumentDialog,
  type VariantAddDocumentSelection,
} from './VariantAddDocumentDialog'
import {VariantBulkActionDialog} from './VariantBulkActionDialog'
import {type VariantBulkAction} from './variantBulkActions'
import {VariantDocumentActions} from './variantDocumentTable/VariantDocumentActions'
import {getVariantDocumentTableColumnDefs} from './variantDocumentTable/VariantDocumentTableColumnDefs'
import {VariantReleaseLane} from './VariantReleaseLane'

function searchVariantDocument(row: DocumentInVariantGroup, searchTerm: string): boolean {
  return searchDocumentRelease(row.document, searchTerm)
}

interface PendingBulkAction {
  action: VariantBulkAction
  groups: DocumentInVariantGroup[]
  /** Clears the table selection on success (absent for a single-row action). */
  clear?: () => void
}

export function VariantDocumentsTable({
  variant,
  rows,
  loading = false,
}: {
  variant: SystemVariant
  rows: DocumentInVariantGroup[]
  loading?: boolean
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {selectedPerspective} = usePerspective()
  const {createVariantDocument, createNewVariantDocument} = useVariantDocumentOperations()
  const variantId = getVariantId(variant._id)

  const [activeLane, setActiveLane] = useState<string>(RELEASE_LANE_ALL)
  const {data: releases} = useActiveReleases()
  const releasesById = useMemo(
    () => new Map(releases.map((release) => [release._id, release])),
    [releases],
  )

  const segments = useMemo(
    () => computeReleaseLaneSegments(rows, releasesById),
    [rows, releasesById],
  )

  const rowsById = useMemo(() => new Map(rows.map((row) => [row.groupId, row])), [rows])

  // The active bulk/single action awaiting confirmation. Both the selection toolbar and the per-row
  // menu funnel into this one dialog, so wiring lives in a single place (the disambiguation dialog
  // resolves the flat selection into concrete per-bundle targets).
  const [pendingAction, setPendingAction] = useState<PendingBulkAction | null>(null)
  // "Add document" (personalize a document into the variant) lives on the table — in the command
  // lane while browsing, and as the empty-state CTA when the variant has no documents yet — so it's
  // reachable in every state and disappears under a bulk selection (the command lane becomes the
  // bulk toolbar). It's a table action, not a definition action, so it's not on the top rail.
  const [addDocumentOpen, setAddDocumentOpen] = useState(false)

  const openBulkAction = useCallback(
    (action: VariantBulkAction, selectedKeys: string[], clear: () => void) => {
      const groups = selectedKeys
        .map((key) => rowsById.get(key))
        .filter((row): row is DocumentInVariantGroup => Boolean(row))
      if (groups.length > 0) setPendingAction({action, groups, clear})
    },
    [rowsById],
  )

  const openRowAction = useCallback((action: VariantBulkAction, row: DocumentInVariantGroup) => {
    setPendingAction({action, groups: [row]})
  }, [])

  const handleAddDocument = useCallback(
    async (document: VariantAddDocumentSelection) => {
      try {
        await createVariantDocument({
          baseId: document._id,
          baseRevisionId: document._rev,
          variant,
          selectedPerspective,
        })
        toast.push({
          closable: true,
          status: 'success',
          title: t('detail.add-document.toast.success'),
        })
        setAddDocumentOpen(false)
      } catch {
        toast.push({closable: true, status: 'error', title: t('detail.add-document.toast.error')})
      }
    },
    [createVariantDocument, selectedPerspective, t, toast, variant],
  )

  const handleCreateNew = useCallback(
    async (type: string) => {
      try {
        await createNewVariantDocument({type, variant, selectedPerspective})
        toast.push({
          closable: true,
          status: 'success',
          title: t('detail.add-document.toast.success'),
        })
        setAddDocumentOpen(false)
      } catch {
        toast.push({closable: true, status: 'error', title: t('detail.add-document.toast.error')})
      }
    },
    [createNewVariantDocument, selectedPerspective, t, toast, variant],
  )

  // If the active release lane disappears (e.g. its documents move), fall back to "All".
  const resolvedActiveLane =
    activeLane === RELEASE_LANE_ALL || segments.some((segment) => segment.id === activeLane)
      ? activeLane
      : RELEASE_LANE_ALL

  // Filter tabs are the one way to scope by bundle (grouping was removed: filtering preserves
  // column sorting, which grouping cannot). A selected tab filters the flat, always-sortable list;
  // the shared DocumentTable applies free-text search on top of these lane-filtered rows.
  const laneRows = useMemo(() => {
    const filtered =
      resolvedActiveLane === RELEASE_LANE_ALL
        ? rows
        : rows.filter((row) => rowMatchesLane(row, resolvedActiveLane, releasesById))
    return filtered.map((row) => ({...row, rowKey: row.groupId}))
  }, [rows, resolvedActiveLane, releasesById])

  const handleSelectLane = useCallback((laneId: string) => {
    // Clicking the already-active segment clears the filter back to "All".
    setActiveLane((previous) => (previous === laneId ? RELEASE_LANE_ALL : laneId))
  }, [])

  const renderRowActions = useCallback(
    ({datum}: {datum: unknown}) => (
      <VariantDocumentActions
        onAction={openRowAction}
        row={datum as DocumentInVariantGroup}
        t={t}
      />
    ),
    [openRowAction, t],
  )

  const hasReleaseControls = !loading && rows.length > 0 && segments.length > 1

  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById),
    [t, variantId, releasesById],
  )

  // "Add document" beside search while browsing. The shared table hides the command lane under a
  // bulk selection (it becomes the bulk toolbar), so this naturally disappears when rows are
  // selected — adding a document mid-selection would be confusing.
  const commandLaneActions = (
    <Button
      data-testid="variant-add-document-button"
      icon={AddIcon}
      mode="ghost"
      onClick={() => setAddDocumentOpen(true)}
      text={t('detail.add-document.action')}
    />
  )

  // Empty state carries its own "Add document" CTA — the command lane is hidden when there are no
  // documents, so this is the entry point for a fresh variant.
  const renderEmptyState = useCallback(
    () => (
      <Flex align="center" direction="column" gap={4} padding={5}>
        <Text align="center" muted size={1}>
          {t('detail.documents.no-documents')}
        </Text>
        <Stack>
          <Button
            data-testid="variant-add-document-empty"
            icon={AddIcon}
            mode="default"
            onClick={() => setAddDocumentOpen(true)}
            text={t('detail.add-document.action')}
          />
        </Stack>
      </Flex>
    ),
    [t],
  )

  const selection = useMemo<DocumentTableSelection>(
    () => ({
      labels: {
        selectAll: t('detail.documents.bulk.select-all'),
        selectRow: t('detail.documents.bulk.select-row'),
        selectedCount: (count) => t('detail.documents.bulk.selected', {count}),
        clear: t('detail.documents.bulk.clear'),
      },
      selectAllTestId: 'variant-bulk-select-all',
      // Primary constructive actions Publish (green) + Add to release; Unpublish + the destructive
      // Delete under the overflow. On narrow widths everything folds into the overflow. Add to
      // release still needs a target-release picker, so it stays disabled (tracked separately).
      renderActions: ({selectedKeys, compact, clear}) => (
        <Flex align="center" flex="none" gap={2}>
          {!compact && (
            <>
              <Button
                data-testid="variant-bulk-publish"
                icon={PublishIcon}
                onClick={() => openBulkAction('publish', selectedKeys, clear)}
                text={t('detail.documents.bulk.publish')}
                tone="positive"
              />
              <Button
                data-testid="variant-bulk-add-to-release"
                disabled
                icon={AddIcon}
                mode="ghost"
                text={t('detail.documents.bulk.add-to-release')}
              />
            </>
          )}
          <MenuButton
            id="variant-bulk-more"
            button={
              <Button
                data-testid="variant-bulk-more"
                icon={EllipsisHorizontalIcon}
                mode="bleed"
                tooltipProps={{content: t('detail.documents.bulk.more')}}
              />
            }
            menu={
              <Menu>
                {compact && (
                  <>
                    <MenuItem
                      data-testid="variant-bulk-publish"
                      icon={PublishIcon}
                      onClick={() => openBulkAction('publish', selectedKeys, clear)}
                      text={t('detail.documents.bulk.publish')}
                      tone="positive"
                    />
                    <MenuItem
                      data-testid="variant-bulk-add-to-release"
                      disabled
                      icon={AddIcon}
                      text={t('detail.documents.bulk.add-to-release')}
                    />
                    <MenuDivider />
                  </>
                )}
                <MenuItem
                  data-testid="variant-bulk-unpublish"
                  icon={UnpublishIcon}
                  onClick={() => openBulkAction('unpublish', selectedKeys, clear)}
                  text={t('detail.documents.bulk.unpublish')}
                />
                <MenuItem
                  data-testid="variant-bulk-delete"
                  icon={TrashIcon}
                  onClick={() => openBulkAction('delete', selectedKeys, clear)}
                  text={t('detail.documents.bulk.delete')}
                  tone="critical"
                />
              </Menu>
            }
            popover={{placement: 'bottom-end', portal: true}}
          />
        </Flex>
      ),
    }),
    [openBulkAction, t],
  )

  return (
    <Fragment>
      <DocumentTable<DocumentInVariantGroup>
        columnDefs={columnDefs}
        commandLaneActions={commandLaneActions}
        defaultSort={{column: 'documentGroup', direction: 'asc'}}
        emptyState={renderEmptyState}
        filterTabs={
          hasReleaseControls ? (
            <VariantReleaseLane
              activeLane={resolvedActiveLane}
              onSelectLane={handleSelectLane}
              segments={segments}
              totalCount={rows.length}
            />
          ) : undefined
        }
        getRowKey={(row) => row.groupId}
        id="variant-documents-table"
        loading={loading}
        rowActions={renderRowActions}
        rows={laneRows}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="rowKey"
        searchPlaceholder={t('detail.documents.table.search-placeholder')}
        searchPredicate={searchVariantDocument}
        searchTestId="variant-documents-search"
        selection={selection}
      />
      {pendingAction && (
        <VariantBulkActionDialog
          action={pendingAction.action}
          groups={pendingAction.groups}
          onClose={() => setPendingAction(null)}
          onSuccess={() => pendingAction.clear?.()}
          releasesById={releasesById}
          variantId={variantId}
        />
      )}
      {addDocumentOpen && (
        <VariantAddDocumentDialog
          onClose={() => setAddDocumentOpen(false)}
          onCreateNew={handleCreateNew}
          onSelect={handleAddDocument}
        />
      )}
    </Fragment>
  )
}
