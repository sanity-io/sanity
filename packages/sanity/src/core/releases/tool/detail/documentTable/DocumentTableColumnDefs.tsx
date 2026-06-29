import {type ReleaseState} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Badge, Box, Flex, Text} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {AvatarSkeleton, UserAvatar} from '../../../../components'
import {RelativeTime} from '../../../../components/RelativeTime'
import {useSchema} from '../../../../hooks'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {getReleaseDocumentIntent} from '../../components/getReleaseDocumentIntent'
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

// Carries its own overflow CSS because @sanity/ui's `textOverflow` prop is inert here.
const TruncatedSpan = styled.span`
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

/** @internal - exported for unit testing only */
export function DocumentType({type}: {type: string}) {
  const schema = useSchema()
  const title = schema.get(type)?.title || 'Not found'

  const elementRef = useRef<HTMLSpanElement | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  const checkTruncation = useCallback(() => {
    const element = elementRef.current
    if (element) setIsTruncated(element.scrollWidth > element.clientWidth)
  }, [])

  // A callback ref ensures React invokes measurement the moment the node attaches, regardless
  // of which commit that happens in - avoiding the race where a useEffect fires before the ref
  // is populated. Returning a cleanup function from the callback is the React 19 mechanism for
  // disconnecting the observer when the node detaches.
  const measureRef = useCallback(
    (element: HTMLSpanElement | null) => {
      elementRef.current = element
      if (!element) return undefined

      checkTruncation()

      const observer = new ResizeObserver(checkTruncation)
      observer.observe(element)

      // Web fonts usually finish loading after the first paint. The font swap widens the
      // text and triggers the CSS ellipsis, but the span's box stays locked to the column
      // width - so the ResizeObserver never fires and the overflow would go undetected.
      let cancelled = false
      void document.fonts?.ready.then(() => {
        if (!cancelled) checkTruncation()
      })

      return () => {
        cancelled = true
        observer.disconnect()
        elementRef.current = null
      }
    },
    [checkTruncation],
  )

  // A title change rewrites the text without resizing the box, so the ResizeObserver would
  // miss it - re-measure explicitly when the title changes.
  useEffect(() => {
    checkTruncation()
  }, [title, checkTruncation])

  const textElement = (
    <Text size={1}>
      <TruncatedSpan ref={measureRef}>{title}</TruncatedSpan>
    </Text>
  )

  if (isTruncated) {
    return (
      <Tooltip portal content={<Text size={1}>{title}</Text>}>
        {textElement}
      </Tooltip>
    )
  }

  return textElement
}

const MemoDocumentType = memo(DocumentType, (prev, next) => prev.type === next.type)

const documentActionColumn: (t: TFunction<'releases'>) => Column<BundleDocumentRow> = (t) => ({
  id: 'action',
  width: null,
  style: {minWidth: 100},
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
          {t(documentActionConfig.labelKey)}
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
  t: TFunction<'releases'>,
) => Column<BundleDocumentRow>[] = (releaseId, releaseState, t) => [
  /**
   * Hiding action for archived and published releases of v1.0
   * This will be added once Events API has reverse order lookup supported
   */
  ...(releaseState === 'archived' || releaseState === 'published' ? [] : [documentActionColumn(t)]),
  {
    id: 'document._type',
    // Fixed width so the header and body cells agree: the table renders the header row and
    // each body row as independent flexboxes, so a content-sized column (width: null) settles
    // at the short header's width in the header row and the long title's width in the body row,
    // misaligning the two. A fixed width is what every other column here relies on to line up.
    width: 150,
    sorting: true,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text={t('table-header.type')} {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" {...cellProps}>
        <Box paddingX={2} style={{minWidth: 0}}>
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

      const errors = datum.validation.validation.filter(
        (validation) => validation.level === 'error',
      )
      const validationErrorCount = errors.length

      // Deep-link to the first field-level error (fall back to the first error). The
      // existing params.path -> field-focus plumbing in DocumentPaneProvider scrolls to
      // and focuses the field when the document opens.
      const firstError = errors.find((error) => error.path.length > 0) ?? errors[0]
      const focusPath = firstError ? pathToString(firstError.path) : undefined
      const intent = getReleaseDocumentIntent({
        documentId: datum.document._id,
        documentTypeName: datum.document._type,
        releaseId,
        releaseState,
        documentRevision: datum.document._rev,
        path: focusPath,
      })
      const errorLabel = t(
        validationErrorCount === 1
          ? 'document-validation.error_one'
          : 'document-validation.error_other',
        {count: validationErrorCount},
      )

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
                    {errorLabel}
                  </Flex>
                </Text>
              }
            >
              <Text size={1}>
                <IntentLink
                  intent="edit"
                  params={intent.params}
                  searchParams={intent.searchParams}
                  aria-label={errorLabel}
                  data-testid={`validation-error-link-${datum.document._id}`}
                >
                  <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                </IntentLink>
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
