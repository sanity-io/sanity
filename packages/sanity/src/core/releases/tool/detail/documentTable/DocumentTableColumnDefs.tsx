import {type ReleaseState} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Badge, Box, Flex, Text} from '@sanity/ui'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {memo} from 'react'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {AvatarSkeleton, UserAvatar} from '../../../../components'
import {RelativeTime} from '../../../../components/RelativeTime'
import {useSchema} from '../../../../hooks'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {Headers} from '../../components/Table/TableHeader'
import {type Column, type InjectedTableProps} from '../../components/Table/types'
import {getDocumentActionType, getReleaseDocumentActionConfig} from '../releaseDocumentActions'
import {type BundleDocumentRow} from '../ReleaseSummary'
import {type DocumentInRelease} from '../useBundleDocuments'
import {useReleaseHistory} from './useReleaseHistory'

const MemoReleaseDocumentPreview = memo(
  function MemoReleaseDocumentPreview({
    item,
    releaseId,
    releaseState,
    documentRevision,
  }: {
    item: DocumentInRelease
    releaseId: string
    releaseState?: ReleaseState
    documentRevision?: string
  }) {
    const isGoingToBePublished = isGoingToUnpublish(item.document)

    return (
      <ReleaseDocumentPreview
        documentId={item.document._id}
        documentTypeName={item.document._type}
        releaseId={releaseId}
        releaseState={releaseState}
        documentRevision={documentRevision}
        isGoingToBePublished={isGoingToBePublished}
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

const documentActionColumn: (t: TFunction<'releases', undefined>) => Column<BundleDocumentRow> = (
  t,
) => ({
  id: 'action',
  width: 100,
  header: (props) => (
    <Flex {...props.headerProps} paddingY={3} sizing="border">
      <Headers.BasicHeader text={t('table-header.action')} />
    </Flex>
  ),
  cell: ({cellProps, datum}) => {
    const actionBadge = () => {
      const actionType = getDocumentActionType(datum)
      if (!actionType) return null

      const documentActionConfig = getReleaseDocumentActionConfig(actionType)
      if (!documentActionConfig) return null

      return (
        <Badge
          radius={2}
          tone={documentActionConfig.tone}
          data-testid={`${actionType}-badge-${datum.document._id}`}
        >
          {t(documentActionConfig.translationKey)}
        </Badge>
      )
    }

    return (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2}>{actionBadge()}</Box>
      </Flex>
    )
  },
})

export const getDocumentTableColumnDefs: (
  releaseId: string,
  releaseState: ReleaseState,
  t: TFunction<'releases', undefined>,
) => Column<BundleDocumentRow>[] = (releaseId, releaseState, t) => [
  /**
   * Hiding action for archived and published releases of v1.0
   * This will be added once Events API has reverse order lookup supported
   */
  ...(releaseState === 'archived' || releaseState === 'published' ? [] : [documentActionColumn(t)]),
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
          {!datum.isLoading && <MemoDocumentType type={datum.document._type} />}
        </Box>
      </Flex>
    ),
  },
  {
    id: 'search',
    width: null,
    style: {minWidth: '50%', maxWidth: '50%'},
    sortTransform(value) {
      return (
        String(
          value.document?.title || value.document?.name || value.document?._id,
        ).toLowerCase() || 0
      )
    },
    header: (props) => (
      <Headers.TableHeaderSearch {...props} placeholder={t('search-documents-placeholder')} />
    ),
    cell: ({cellProps, datum}) => (
      <Box {...cellProps} flex={1} padding={1} paddingRight={2} sizing="border">
        {datum.isPending || datum.isLoading ? (
          <SanityDefaultPreview isPlaceholder />
        ) : (
          <MemoReleaseDocumentPreview
            item={datum}
            releaseId={releaseId}
            releaseState={releaseState}
            documentRevision={datum.document._rev}
          />
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
        <Headers.SortHeaderButton text={t('table-header.edited')} {...props} />
      </Flex>
    ),
    cell: (props) => <UpdatedAtCell {...props} releaseDocumentId={releaseId} />,
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
                  <Flex align={'center'} gap={3} padding={1}>
                    <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                    {t(
                      validationErrorCount === 1
                        ? 'document-validation.error_one'
                        : 'document-validation.error_other',
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

function UpdatedAtCell({
  cellProps,
  datum,
  releaseDocumentId,
}: {
  cellProps: InjectedTableProps
  datum: BundleDocumentRow & {isLoading?: boolean}
  releaseDocumentId: string
}) {
  const {document, isLoading} = datum
  const bundleId = getReleaseIdFromReleaseDocumentId(releaseDocumentId)
  const historyDocumentId =
    datum.isPending || document?._id?.endsWith('-pending') ? undefined : document?._id
  const {documentHistory} = useReleaseHistory(historyDocumentId, bundleId, document?._rev)

  return (
    <Flex
      {...cellProps}
      align="center"
      paddingX={2}
      paddingY={3}
      style={{minWidth: 130}}
      sizing="border"
    >
      <Flex align="center" gap={2}>
        {(isLoading || !documentHistory?.lastEditedBy) && <AvatarSkeleton $size={0} animated />}
        {!isLoading && document._updatedAt && (
          <>
            {documentHistory?.lastEditedBy && (
              <UserAvatar size={0} user={documentHistory.lastEditedBy} />
            )}
            <Text muted size={1}>
              <RelativeTime time={document._updatedAt} useTemporalPhrase minimal />
            </Text>
          </>
        )}
      </Flex>
    </Flex>
  )
}
