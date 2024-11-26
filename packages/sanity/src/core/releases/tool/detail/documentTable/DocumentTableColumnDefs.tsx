import {ErrorOutlineIcon} from '@sanity/icons'
import {Badge, Box, Flex, Text} from '@sanity/ui'
import {type TFunction} from 'i18next'
import {memo} from 'react'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {UserAvatar} from '../../../../components'
import {RelativeTime} from '../../../../components/RelativeTime'
import {useSchema} from '../../../../hooks'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {Headers} from '../../components/Table/TableHeader'
import {type Column} from '../../components/Table/types'
import {type BundleDocumentRow} from '../ReleaseSummary'
import {type DocumentInRelease} from '../useBundleDocuments'

const MemoReleaseDocumentPreview = memo(
  function MemoReleaseDocumentPreview({
    item,
    releaseId,
  }: {
    item: DocumentInRelease
    releaseId: string
  }) {
    return (
      <ReleaseDocumentPreview
        documentId={item.document._id}
        documentTypeName={item.document._type}
        releaseId={releaseId}
        previewValues={item.previewValues.values}
        isLoading={item.previewValues.isLoading}
        hasValidationError={item.validation?.hasError}
      />
    )
  },
  (prev, next) => prev.item.memoKey === next.item.memoKey && prev.releaseId === next.releaseId,
)

const MemoDocumentType = memo(
  function DocumentType({type}: {type: string}) {
    const schema = useSchema()
    const schemaType = schema.get(type)
    return <Text size={1}>{schemaType?.title || 'Not found'}</Text>
  },
  (prev, next) => prev.type === next.type,
)

export const getDocumentTableColumnDefs: (
  releaseId: string,
  t: TFunction<'releases', undefined>,
) => Column<BundleDocumentRow>[] = (releaseId, t) => [
  {
    id: 'action',
    width: 100,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.BasicHeader text={t('table-header.action')} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2}>
          {datum.document.publishedDocumentExists ? (
            <Badge radius={2} tone={'caution'}>
              {t('table-body.action.change')}
            </Badge>
          ) : (
            <Badge radius={2} tone={'positive'}>
              {t('table-body.action.add')}
            </Badge>
          )}
        </Box>
      </Flex>
    ),
  },
  {
    id: 'document._type',
    width: 100,
    sorting: true,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('table-header.type')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2}>
          <MemoDocumentType type={datum.document._type} />
        </Box>
      </Flex>
    ),
  },
  {
    id: 'search',
    width: null,
    style: {minWidth: '50%', maxWidth: '50%'},
    sortTransform(value) {
      return value.previewValues.values.title?.toLowerCase() || 0
    },
    header: (props) => (
      <Headers.TableHeaderSearch {...props} placeholder={t('search-documents-placeholder')} />
    ),
    cell: ({cellProps, datum}) => (
      <Box {...cellProps} flex={1} padding={1} paddingRight={2} sizing="border">
        <MemoReleaseDocumentPreview item={datum} releaseId={releaseId} />
      </Box>
    ),
  },
  {
    id: 'document._updatedAt',
    sorting: true,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('table-header.edited')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: {document, history}}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {document._updatedAt && (
          <Flex align="center" gap={2}>
            {history?.lastEditedBy && <UserAvatar size={0} user={history.lastEditedBy} />}
            <Text muted size={1}>
              <RelativeTime time={document._updatedAt} useTemporalPhrase minimal />
            </Text>
          </Flex>
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
      const validationErrorCount = datum.validation.validation.length

      return (
        <Flex {...cellProps} flex={1} padding={1} justify="center" align="center" sizing="border">
          {datum.validation.hasError && (
            <Tooltip
              portal
              placement="bottom-end"
              content={
                <Text muted size={1}>
                  <Flex align={'center'} gap={3} padding={1}>
                    <ToneIcon symbol={ErrorOutlineIcon} tone="critical" />
                    {t(
                      validationErrorCount === 1
                        ? 'document-validation.error-singular'
                        : 'document-validation.error',
                      {count: validationErrorCount},
                    )}
                  </Flex>
                </Text>
              }
            >
              <Text size={1}>
                <ToneIcon symbol={ErrorOutlineIcon} tone="critical" />
              </Text>
            </Tooltip>
          )}
        </Flex>
      )
    },
  },
]
