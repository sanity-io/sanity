import {type ReleaseDocument} from '@sanity/client'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Flex, Text} from '@sanity/ui'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {memo} from 'react'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {EditedByCell} from '../../../../components/documentTable/EditedByCell'
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

// Per-row validation status, rendered in its own narrow column so every row answers the same
// question in the same place — a scannable "ready vs. not" rail. A structural column beats an
// inline error-only glyph: because it's always present, an empty-looking cell reads as "checked,
// fine" (a muted check) rather than the ambiguous absence of an inline mark. Errors get the loud
// critical glyph so they pop against the muted checks around them.
function ValidationStatusIndicator({
  datum,
  t,
}: {
  datum: DocumentInVariantGroup
  t: TFunction<'variants'>
}) {
  if (datum.validation.hasError) {
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

  return (
    <Tooltip
      portal
      placement="bottom-end"
      content={
        <Text muted size={1}>
          <Box padding={1}>{t('detail.documents.table.validation.valid')}</Box>
        </Text>
      }
    >
      <Text muted size={1} data-testid="variant-document-validation-valid">
        <ToneIcon icon={CheckmarkCircleIcon} tone="positive" />
      </Text>
    </Tooltip>
  )
}

// The leading select column (select-all header + row checkboxes) is injected by the shared
// DocumentTable, so it is not defined here.
export const getVariantDocumentTableColumnDefs = (
  t: TFunction<'variants'>,
  variantId: string | undefined,
  releasesById: Map<string, ReleaseDocument>,
): Column<DocumentInVariantGroup>[] => [
  {
    id: 'documentGroup',
    hidden: true,
    width: null,
    sorting: true,
    sortTransform: (row) => row.rowKey ?? row.groupId,
  },
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
        <Headers.SortHeaderButton
          paddingLeft={2}
          text={t('detail.documents.table.appears-in')}
          {...props}
        />
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
        <Headers.SortHeaderButton
          paddingLeft={2}
          text={t('detail.documents.table.type')}
          {...props}
        />
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
    // The document preview / title column. Search moved out of this header into the command lane;
    // the header is a plain sortable "Document" label. flex={1} in BOTH header and body (the body
    // cell below is also flex={1}) so this column grows to fill the row — pushing "Edited" to the
    // right edge with no trailing dead space — and keeps the same width whether the table has rows
    // or not. (A content-sized column collapses to its label width when empty and diverges between
    // the independent header and body flexboxes.)
    id: 'search',
    width: null,
    style: {minWidth: 240},
    sorting: true,
    sortTransform: ({document}) => getDocumentPreviewTitle(document).toLowerCase(),
    header: (props) => (
      <Flex {...props.headerProps} flex={1} paddingY={3} sizing="border">
        <Headers.SortHeaderButton
          paddingLeft={2}
          text={t('detail.documents.table.document')}
          {...props}
        />
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
      </Flex>
    ),
  },
  {
    // "Edited by" — the person who last edited the document. Its own named column (not just an
    // avatar tucked beside the time) so authorship reads distinctly from live presence, which stays
    // in the document preview. The name collapses to avatar-only when the column is squeezed.
    id: 'editedBy',
    sorting: false,
    width: 170,
    style: {minWidth: 44, maxWidth: 170},
    header: (props) => (
      <Flex {...props.headerProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Text muted size={1} textOverflow="ellipsis" weight="medium">
          {t('detail.documents.table.edited-by')}
        </Text>
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {!datum.isLoading && (
          <EditedByCell documentId={datum.document._id} revision={datum.document._rev} />
        )}
      </Flex>
    ),
  },
  {
    id: 'document._updatedAt',
    sorting: true,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Text muted size={1} textOverflow="ellipsis" weight="medium">
          {t('detail.documents.table.last-edited')}
        </Text>
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
  {
    // Validation status trails the row, grouped with the other status/meta columns (edited-by,
    // last-edited) and matching the releases table. A scannable "ready vs. has errors" cell —
    // sortable so a reader can pull error rows to the top. No header label: the glyphs speak for
    // themselves and a text header would overflow the 44px slot.
    id: 'validation',
    width: 44,
    style: {minWidth: 44, maxWidth: 44},
    sorting: true,
    sortTransform: (row) => (row.validation.hasError ? 0 : 1),
    header: (props) => <Flex {...props.headerProps} paddingY={3} sizing="border" />,
    cell: ({cellProps, datum}) => (
      <Flex {...cellProps} align="center" justify="center" paddingY={3} sizing="border">
        {!datum.isLoading && <ValidationStatusIndicator datum={datum} t={t} />}
      </Flex>
    ),
  },
]
