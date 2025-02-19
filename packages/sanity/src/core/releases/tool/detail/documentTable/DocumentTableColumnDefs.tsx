import {ErrorOutlineIcon} from '@sanity/icons'
import {Badge, Box, Flex, Text} from '@sanity/ui'
import {type TFunction} from 'i18next'
import {memo} from 'react'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {UserAvatar} from '../../../../components'
import {RelativeTime} from '../../../../components/RelativeTime'
import {useSchema} from '../../../../hooks'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {type ReleaseState} from '../../../store'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {Headers} from '../../components/Table/TableHeader'
import {type Column} from '../../components/Table/types'
import {type BundleDocumentRow} from '../ReleaseSummary'
import {type DocumentInRelease} from '../useBundleDocuments'

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
    return (
      <ReleaseDocumentPreview
        documentId={item.document._id}
        documentTypeName={item.document._type}
        releaseId={releaseId}
        releaseState={releaseState}
        documentRevision={documentRevision}
        previewValues={item.previewValues.values}
        isLoading={item.previewValues.isLoading}
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
      if (datum.isPending) return null

      const willBeUnpublished = isGoingToUnpublish(datum.document)
      if (willBeUnpublished) {
        return (
          <Badge radius={2} tone={'critical'} data-testid={`unpublish-badge-${datum.document._id}`}>
            {t('table-body.action.unpublish')}
          </Badge>
        )
      }
      if (datum.document.publishedDocumentExists) {
        return (
          <Badge radius={2} tone={'caution'} data-testid={`change-badge-${datum.document._id}`}>
            {t('table-body.action.change')}
          </Badge>
        )
      }

      return (
        <Badge radius={2} tone={'positive'} data-testid={`add-badge-${datum.document._id}`}>
          {t('table-body.action.add')}
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
      if (!value.previewValues) return 0

      return value.previewValues.values?.title?.toLowerCase() || 0
    },
    header: (props) => (
      <Headers.TableHeaderSearch {...props} placeholder={t('search-documents-placeholder')} />
    ),
    cell: ({cellProps, datum}) => (
      <Box {...cellProps} flex={1} padding={1} paddingRight={2} sizing="border">
        {datum.isPending ? (
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
    cell: ({cellProps, datum: {document, history}}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        style={{minWidth: 130}}
        sizing="border"
      >
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
