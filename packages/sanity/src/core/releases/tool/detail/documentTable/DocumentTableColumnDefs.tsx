import {Badge, Box, Flex, Text} from '@sanity/ui'
import {memo} from 'react'
import {type TFunction, UserAvatar, useSchema} from 'sanity'

import {RelativeTime} from '../../../../components/RelativeTime'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {Headers} from '../../components/Table/TableHeader'
import {type Column} from '../../components/Table/types'
import {type BundleDocumentRow} from '../ReleaseSummary'
import {type DocumentInBundleResult} from '../useBundleDocuments'

const MemoReleaseDocumentPreview = memo(
  function MemoReleaseDocumentPreview({
    item,
    releaseSlug,
  }: {
    item: DocumentInBundleResult
    releaseSlug: string
  }) {
    return (
      <ReleaseDocumentPreview
        documentId={item.document._id}
        documentTypeName={item.document._type}
        releaseSlug={releaseSlug}
        previewValues={item.previewValues.values}
        isLoading={item.previewValues.isLoading}
        hasValidationError={item.validation?.hasError}
      />
    )
  },
  (prev, next) => prev.item.memoKey === next.item.memoKey && prev.releaseSlug === next.releaseSlug,
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
) => Column<BundleDocumentRow>[] = (releaseSlug, t) => [
  {
    id: 'action',
    width: 100,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('table-header.action')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2}>
          {/* TODO: Determine if the document was added or not, check for the existance of the document in it's non version type. */}
          {datum.isAdded ? (
            <Badge radius={2} tone={'positive'}>
              {t('table-body.action.add')}
            </Badge>
          ) : (
            <Badge radius={2} tone={'caution'}>
              {t('table-body.action.change')}
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
    header: (props) => (
      <Headers.TableHeaderSearch {...props} placeholder={t('search-documents-placeholder')} />
    ),
    cell: ({cellProps, datum}) => (
      <Box {...cellProps} flex={1} padding={1}>
        <MemoReleaseDocumentPreview item={datum} releaseSlug={releaseSlug} />
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
]
