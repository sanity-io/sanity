import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Checkbox, Flex, Text} from '@sanity/ui'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {memo} from 'react'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {RelativeTime} from '../../../../components/RelativeTime'
import {useSchema} from '../../../../hooks'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {Headers} from '../../../../releases/tool/components/Table/TableHeader'
import {type Column} from '../../../../releases/tool/components/Table/types'
import {getRowBundleSortKey} from '../releaseLane'
import {type DocumentInVariantGroup} from '../types'
import {getDocumentPreviewTitle} from './getDocumentPreviewTitle'
import {VariantDocumentBundleChips} from './VariantDocumentBundleChips'
import {VariantDocumentPreview} from './VariantDocumentPreview'

const MemoVariantDocumentPreview = memo(
  function MemoVariantDocumentPreview({
    row,
    releasesById,
    variantId,
  }: {
    row: DocumentInVariantGroup
    releasesById: Map<string, ReleaseDocument>
    variantId?: string
  }) {
    return <VariantDocumentPreview releasesById={releasesById} row={row} variantId={variantId} />
  },
  (prev, next) =>
    prev.row.memoKey === next.row.memoKey &&
    prev.variantId === next.variantId &&
    prev.releasesById === next.releasesById,
)

const MemoDocumentType = memo(
  function DocumentType({type}: {type: string}) {
    const schema = useSchema()
    const schemaType = schema.get(type)

    return <Text size={1}>{schemaType?.title || type}</Text>
  },
  (prev, next) => prev.type === next.type,
)

// The critical-validation indicator. Rendered inline at the trailing edge of the document preview
// (rather than in a separate far-right column) so the error is unmistakably tied to *its* document
// instead of floating in the table's right-hand dead space.
function ValidationErrorIndicator({
  datum,
  t,
}: {
  datum: DocumentInVariantGroup
  t: TFunction<'variants'>
}) {
  const validationErrorCount = datum.validation.validation.filter(
    (validation) => validation.level === 'error',
  ).length

  return (
    <Tooltip
      portal
      placement="bottom-end"
      content={
        <Text muted size={1}>
          <Flex align="center" gap={3} padding={1}>
            <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
            {t(
              validationErrorCount === 1
                ? 'detail.documents.table.validation.error_one'
                : 'detail.documents.table.validation.error_other',
              {count: validationErrorCount},
            )}
          </Flex>
        </Text>
      }
    >
      <Text size={1} data-testid="variant-document-validation-error">
        <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
      </Text>
    </Tooltip>
  )
}

/**
 * Row-selection state + handlers for the bulk-action UX, threaded into the leading checkbox column.
 *
 * @internal
 */
export interface VariantDocumentSelection {
  isSelected: (groupId: string) => boolean
  onToggleRow: (groupId: string) => void
  allSelected: boolean
  someSelected: boolean
  onToggleAll: () => void
}

export const getVariantDocumentTableColumnDefs = (
  t: TFunction<'variants'>,
  variantId: string | undefined,
  releasesById: Map<string, ReleaseDocument>,
  selection?: VariantDocumentSelection,
): Column<DocumentInVariantGroup>[] => [
  {
    id: 'documentGroup',
    hidden: true,
    width: null,
    sorting: true,
    sortTransform: (row) => row.rowKey ?? row.groupId,
  },
  // Leading checkbox column for bulk selection. Only present when the table is wired for selection;
  // loading rows render no checkbox (they aren't documents you can act on).
  ...(selection
    ? [
        {
          id: 'select',
          width: 44,
          style: {minWidth: 44, maxWidth: 44},
          sorting: false,
          // Empty header: select-all lives in the command-lane selection bar, not here. The
          // column-header row is column labels + sort only (three-zone header spec).
          header: ({headerProps}) => (
            <Flex {...headerProps} align="center" justify="center" paddingY={3} sizing="border" />
          ),
          cell: ({cellProps, datum}) => (
            <Flex {...cellProps} align="center" justify="center" paddingX={2} sizing="border">
              {!datum.isLoading && (
                <Checkbox
                  aria-label={t('detail.documents.bulk.select-row')}
                  checked={selection.isSelected(datum.groupId)}
                  // Stop the row's own click/navigation from firing when toggling the checkbox.
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => selection.onToggleRow(datum.groupId)}
                />
              )}
            </Flex>
          ),
        } satisfies Column<DocumentInVariantGroup>,
      ]
    : []),
  {
    id: 'bundle',
    // Wider than the old 140 so typical release names ("Compliance Dashboard") render in full;
    // only genuine outliers truncate. The extra room is reclaimed from the Type column below,
    // which only ever holds short schema titles.
    width: 190,
    style: {minWidth: 120, maxWidth: 190},
    sorting: true,
    sortTransform: (row) => getRowBundleSortKey(row, releasesById),
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('detail.documents.table.appears-in')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex
        align="center"
        {...cellProps}
        style={{...cellProps.style, flex: '0 1 auto', minWidth: 0, overflow: 'hidden'}}
      >
        <Box style={{minWidth: 0, overflow: 'hidden'}} paddingX={2}>
          {!datum.isLoading && (
            <VariantDocumentBundleChips versions={datum.versions} releasesById={releasesById} />
          )}
        </Box>
      </Flex>
    ),
  },
  {
    id: 'document._type',
    // Trimmed from 160 → 130: schema titles are short, so the freed width goes to "Appears in".
    width: 130,
    style: {minWidth: 110, maxWidth: 130},
    sorting: true,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('detail.documents.table.type')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2}>
          {!datum.isLoading && <MemoDocumentType type={datum.document._type} />}
        </Box>
      </Flex>
    ),
  },
  {
    // The document preview / title column. Search moved out of this header into the command lane
    // (three-zone header spec); the header is now a plain sortable "Document" label.
    id: 'search',
    width: null,
    style: {minWidth: 'min(50%, calc(100vw - 80px))', maxWidth: 'min(50%, calc(100vw - 80px))'},
    sorting: true,
    sortTransform: ({document}) => getDocumentPreviewTitle(document).toLowerCase(),
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('detail.documents.table.document')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex
        {...cellProps}
        align="center"
        flex={1}
        gap={2}
        padding={1}
        paddingRight={2}
        sizing="border"
      >
        <Box flex={1} style={{minWidth: 0}}>
          {datum.isLoading ? (
            <SanityDefaultPreview isPlaceholder />
          ) : (
            <MemoVariantDocumentPreview
              releasesById={releasesById}
              row={datum}
              variantId={variantId}
            />
          )}
        </Box>
        {!datum.isLoading && datum.validation.hasError && (
          <Box flex="none">
            <ValidationErrorIndicator datum={datum} t={t} />
          </Box>
        )}
      </Flex>
    ),
  },
  {
    id: 'document._updatedAt',
    sorting: true,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('detail.documents.table.edited')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} style={{minWidth: 130}}>
        {!datum.isLoading && datum.document._updatedAt && (
          <Text muted size={1}>
            <RelativeTime time={datum.document._updatedAt} useTemporalPhrase minimal />
          </Text>
        )}
      </Flex>
    ),
  },
]
