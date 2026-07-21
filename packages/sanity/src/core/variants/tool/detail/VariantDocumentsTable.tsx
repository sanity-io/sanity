import {AddIcon} from '@sanity/icons/Add'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Flex, Menu, MenuDivider} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {
  DocumentTable,
  type DocumentTableSelection,
} from '../../../releases/tool/components/Table/DocumentTable'
import {type Column} from '../../../releases/tool/components/Table/types'
import {searchDocumentRelease} from '../../../releases/tool/detail/documentTable/searchDocumentRelease'
import {variantsLocaleNamespace} from '../../i18n'
import {computeReleaseLaneSegments, RELEASE_LANE_ALL, rowMatchesLane} from './releaseLane'
import {type DocumentInVariantGroup} from './types'
import {getVariantDocumentTableColumnDefs} from './variantDocumentTable/VariantDocumentTableColumnDefs'
import {VariantReleaseLane} from './VariantReleaseLane'

function searchVariantDocument(row: DocumentInVariantGroup, searchTerm: string): boolean {
  return searchDocumentRelease(row.document, searchTerm)
}

export function VariantDocumentsTable({
  rows,
  loading = false,
  variantId,
}: {
  rows: DocumentInVariantGroup[]
  loading?: boolean
  variantId?: string
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
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

  const hasReleaseControls = !loading && rows.length > 0 && segments.length > 1

  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById),
    [t, variantId, releasesById],
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
      // Delete under the overflow. On narrow widths everything folds into the overflow. Stubbed
      // (disabled) until wired up (FH-113).
      renderActions: ({compact}) => (
        <Flex align="center" flex="none" gap={2}>
          {!compact && (
            <>
              <Button
                data-testid="variant-bulk-publish"
                disabled
                icon={PublishIcon}
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
                      disabled
                      icon={PublishIcon}
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
                  disabled
                  icon={UnpublishIcon}
                  text={t('detail.documents.bulk.unpublish')}
                />
                <MenuItem
                  data-testid="variant-bulk-delete"
                  disabled
                  icon={TrashIcon}
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
    [t],
  )

  return (
    <DocumentTable<DocumentInVariantGroup>
      columnDefs={columnDefs}
      defaultSort={{column: 'documentGroup', direction: 'asc'}}
      emptyState={t('detail.documents.no-documents')}
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
      rows={laneRows}
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
      rowId="rowKey"
      searchPlaceholder={t('detail.documents.table.search-placeholder')}
      searchPredicate={searchVariantDocument}
      searchTestId="variant-documents-search"
      selection={selection}
    />
  )
}
