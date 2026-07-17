import {type ReleaseDocument} from '@sanity/client'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Card, Flex, Text} from '@sanity/ui'
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
    variantId,
  }: {
    row: DocumentInVariantGroup
    variantId?: string
  }) {
    return <VariantDocumentPreview row={row} variantId={variantId} />
  },
  (prev, next) => prev.row.memoKey === next.row.memoKey && prev.variantId === next.variantId,
)

const MemoDocumentType = memo(
  function DocumentType({type}: {type: string}) {
    const schema = useSchema()
    const schemaType = schema.get(type)

    return <Text size={1}>{schemaType?.title || type}</Text>
  },
  (prev, next) => prev.type === next.type,
)

function ReleaseAggregateHeader({
  datum,
  t,
}: {
  datum: DocumentInVariantGroup
  t: TFunction<'variants'>
}) {
  return (
    <Card
      as="button"
      data-testid="variant-release-aggregate-toggle"
      onClick={datum.onToggleRelease}
      padding={2}
      radius={2}
      tone="inherit"
      type="button"
    >
      <Flex align="center" gap={2}>
        <Text size={1}>{datum.isReleaseExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}</Text>
        <Text size={1} weight="medium">
          {datum.releaseLabel}
        </Text>
        <Text muted size={1}>
          {t(
            datum.releaseCount === 1
              ? 'detail.release-lane.group-count_one'
              : 'detail.release-lane.group-count_other',
            {count: datum.releaseCount ?? 0},
          )}
        </Text>
      </Flex>
    </Card>
  )
}

export const getVariantDocumentTableColumnDefs = (
  t: TFunction<'variants'>,
  variantId: string | undefined,
  releasesById: Map<string, ReleaseDocument>,
  grouped: boolean,
): Column<DocumentInVariantGroup>[] => [
  {
    id: 'documentGroup',
    hidden: true,
    width: null,
    sorting: true,
    sortTransform: (row) => row.groupId,
  },
  {
    id: 'bundle',
    width: 140,
    style: {minWidth: 100, maxWidth: 140},
    sorting: !grouped,
    sortTransform: (row) => getRowBundleSortKey(row, releasesById),
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        {grouped ? (
          <Headers.BasicHeader text={t('detail.documents.table.appears-in')} />
        ) : (
          <Headers.SortHeaderButton text={t('detail.documents.table.appears-in')} {...props} />
        )}
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex
        align="center"
        {...cellProps}
        style={{...cellProps.style, flex: '0 1 auto', minWidth: 0, overflow: 'hidden'}}
      >
        <Box flex={1} paddingX={2} style={{minWidth: 0, overflow: 'hidden'}}>
          {!datum.isLoading && !datum.isReleaseAggregate && (
            <VariantDocumentBundleChips versions={datum.versions} releasesById={releasesById} />
          )}
        </Box>
      </Flex>
    ),
  },
  {
    id: 'document._type',
    width: 160,
    style: {minWidth: 120, maxWidth: 160},
    sorting: !grouped,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        {grouped ? (
          <Headers.BasicHeader text={t('detail.documents.table.type')} />
        ) : (
          <Headers.SortHeaderButton text={t('detail.documents.table.type')} {...props} />
        )}
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2}>
          {!datum.isLoading && !datum.isReleaseAggregate && (
            <MemoDocumentType type={datum.document._type} />
          )}
        </Box>
      </Flex>
    ),
  },
  {
    id: 'search',
    width: null,
    style: {minWidth: 'min(50%, calc(100vw - 80px))', maxWidth: 'min(50%, calc(100vw - 80px))'},
    sortTransform: ({document}) => getDocumentPreviewTitle(document).toLowerCase(),
    header: (props) => (
      <Headers.TableHeaderSearch
        {...props}
        placeholder={t('detail.documents.table.search-placeholder')}
      />
    ),
    cell: ({cellProps, datum}) => (
      <Box {...cellProps} flex={1} padding={1} paddingRight={2} sizing="border">
        {datum.isReleaseAggregate ? (
          <ReleaseAggregateHeader datum={datum} t={t} />
        ) : datum.isLoading ? (
          <SanityDefaultPreview isPlaceholder />
        ) : (
          <MemoVariantDocumentPreview row={datum} variantId={variantId} />
        )}
      </Box>
    ),
  },
  {
    id: 'document._updatedAt',
    sorting: !grouped,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        {grouped ? (
          <Headers.BasicHeader text={t('detail.documents.table.edited')} />
        ) : (
          <Headers.SortHeaderButton text={t('detail.documents.table.edited')} {...props} />
        )}
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} style={{minWidth: 130}}>
        {!datum.isLoading && !datum.isReleaseAggregate && datum.document._updatedAt && (
          <Text muted size={1}>
            <RelativeTime time={datum.document._updatedAt} useTemporalPhrase minimal />
          </Text>
        )}
      </Flex>
    ),
  },
  {
    id: 'validation',
    sorting: false,
    width: 50,
    header: ({headerProps}) => (
      <Flex {...headerProps} paddingY={3} sizing="border">
        <Headers.BasicHeader text={''} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => {
      if (datum.isLoading || datum.isReleaseAggregate) return null

      const validationErrorCount = datum.validation.validation.filter(
        (validation) => validation.level === 'error',
      ).length

      return (
        <Flex {...cellProps} flex={1} padding={1} justify="center" align="center" sizing="border">
          {datum.validation.hasError && (
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
              <Text size={1}>
                <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
              </Text>
            </Tooltip>
          )}
        </Flex>
      )
    },
  },
]
