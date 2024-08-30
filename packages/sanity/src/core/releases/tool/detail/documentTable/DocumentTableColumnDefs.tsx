import {AvatarStack, Box, Flex, Text} from '@sanity/ui'
import {memo} from 'react'
import {type TFunction, UserAvatar} from 'sanity'

import {RelativeTime} from '../../../../components/RelativeTime'
import {ReleaseDocumentPreview} from '../../../components/ReleaseDocumentPreview'
import {Headers} from '../../../components/Table/TableHeader'
import {type Column} from '../../../components/Table/types'
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

export const getDocumentTableColumnDefs: (
  releaseId: string,
  t: TFunction<'releases', undefined>,
) => Column<BundleDocumentRow>[] = (releaseSlug, t) => [
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
    id: 'document._createdAt',
    sorting: true,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('table-header.created')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: {document, history}}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {document._createdAt && (
          <Flex align="center" gap={2}>
            {history?.createdBy && <UserAvatar size={0} user={history.createdBy} />}
            <Text muted size={1}>
              <RelativeTime time={document._createdAt} useTemporalPhrase minimal />
            </Text>
          </Flex>
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
    id: 'document._publishedAt',
    sorting: true,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('table-header.published')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: {document}}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {/* TODO: How to get the publishedAt date from the document, consider history API */}
        {/* {document._publishedAt && (
      <Flex align="center" gap={2}>
        <UserAvatar size={0} user={document._publishedBy} />
        <Text muted size={1}>
          <RelativeTime time={document._publishedAt} />
        </Text>
      </Flex>
    )} */}

        {!document._publishedAt && (
          <Text muted size={1}>
            &nbsp;
          </Text>
        )}
      </Flex>
    ),
  },
  {
    id: 'contributors',
    sorting: false,
    width: 100,
    header: ({headerProps}) => (
      <Flex {...headerProps} paddingY={3} sizing="border">
        <Box padding={2}>
          <Text muted size={1} weight="medium">
            {t('table-header.contributors')}
          </Text>
        </Box>
      </Flex>
    ),
    cell: ({datum: document, cellProps}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {document.history?.editors && (
          <AvatarStack maxLength={3} size={0}>
            {document.history.editors.map((userId) => (
              <UserAvatar key={userId} user={userId} />
            ))}
          </AvatarStack>
        )}
      </Flex>
    ),
  },
]
