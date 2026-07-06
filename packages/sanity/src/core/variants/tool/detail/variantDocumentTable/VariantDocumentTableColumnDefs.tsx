import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Flex, Text} from '@sanity/ui'
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
import {type DocumentInVariantGroup} from '../types'
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

export const getVariantDocumentTableColumnDefs = (
  t: TFunction<'variants'>,
  variantId?: string,
): Column<DocumentInVariantGroup>[] => [
  {
    id: 'bundle',
    width: null,
    style: {minWidth: 100},
    sorting: false,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.BasicHeader text={t('detail.documents.table.bundle')} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2}>
          {!datum.isLoading && <VariantDocumentBundleChips versions={datum.versions} />}
        </Box>
      </Flex>
    ),
  },
  {
    id: 'document._type',
    width: null,
    style: {minWidth: 100},
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
    id: 'search',
    width: null,
    style: {minWidth: 'min(50%, calc(100vw - 80px))', maxWidth: 'min(50%, calc(100vw - 80px))'},
    sortTransform(value) {
      return (
        String(
          value.document?.title || value.document?.name || value.document?._id,
        ).toLowerCase() || 0
      )
    },
    header: (props) => (
      <Headers.TableHeaderSearch
        {...props}
        placeholder={t('detail.documents.table.search-placeholder')}
      />
    ),
    cell: ({cellProps, datum}) => (
      <Box {...cellProps} flex={1} padding={1} paddingRight={2} sizing="border">
        {datum.isLoading ? (
          <SanityDefaultPreview isPlaceholder />
        ) : (
          <MemoVariantDocumentPreview row={datum} variantId={variantId} />
        )}
      </Box>
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
      if (datum.isLoading) return null

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
