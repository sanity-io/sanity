import {type ReleaseState} from '@sanity/client'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Badge, Box, Card, Flex, Text} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {type CSSProperties, memo, useCallback, useEffect, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip'
import {EditedByAvatar} from '../../../../components/documentTable/EditedByCell'
import {RelativeTime} from '../../../../components/RelativeTime'
import {useSchema} from '../../../../hooks'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {RhombusIcon} from '../../../../variants/plugin/components/PersonalizationIcons'
import {
  getVariantConditionsText,
  getVariantIdFromDocument,
  getVariantTitle,
} from '../../../../variants/tool/util'
import {type SystemVariant} from '../../../../variants/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {getReleaseDocumentIntent} from '../../components/getReleaseDocumentIntent'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {Headers} from '../../components/Table/TableHeader'
import {type Column, type InjectedTableProps} from '../../components/Table/types'
import {getDocumentActionType, getReleaseDocumentActionConfig} from '../releaseDocumentActions'
import {type BundleDocumentRow} from '../ReleaseSummary'
import {type DocumentInRelease} from '../types'
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
    const variantId = getVariantIdFromDocument(item.document)

    return (
      <ReleaseDocumentPreview
        documentId={item.document._id}
        documentTypeName={item.document._type}
        releaseId={releaseId}
        releaseState={releaseState}
        documentRevision={documentRevision}
        isGoingToBePublished={isGoingToBePublished}
        variantId={variantId}
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

  // A callback ref measures on attach, avoiding the race where a useEffect fires before the
  // ref is populated. The returned cleanup runs when the node detaches.
  const measureRef = useCallback(
    (element: HTMLSpanElement | null) => {
      elementRef.current = element
      if (!element) return undefined

      checkTruncation()

      const observer = new ResizeObserver(checkTruncation)
      observer.observe(element)

      // The late font swap widens the text but not the column-locked box, so the
      // ResizeObserver never fires - re-measure once fonts settle.
      let cancelled = false
      void document.fonts?.ready?.then(() => {
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

  // A title change rewrites the text without resizing the box, so re-measure on title change.
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
  sorting: true,
  // Sort by the action type (Add / Change / Unpublish) so like actions group together.
  sortTransform(value) {
    return getDocumentActionType(value) || ''
  },
  header: (props) => (
    <Flex {...props.headerProps} paddingY={3} sizing="border">
      <Headers.SortHeaderButton text={t('table-header.action')} {...props} />
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

// Purple, matching the perspective bar's variant motif. The perspective bar gets its purple from a
// `tone="suggest"` Card context (which defines --card-icon-color as the suggest purple); the
// --card-badge-* vars only exist inside a Badge, so we replicate the Card approach: a transparent
// suggest-toned wrapper, with the RhombusIcon (stroke=currentColor) picking up --card-icon-color.
const VARIANT_ICON_CARD_STYLE: CSSProperties = {backgroundColor: 'transparent'}
const VARIANT_ICON_STYLE: CSSProperties = {color: 'var(--card-icon-color)'}

/** Resolves a document's variant definition from its `_system.variant._ref` (full variant id). */
function resolveDocumentVariant(
  document: BundleDocumentRow['document'],
  variantsById: Map<string, SystemVariant>,
): SystemVariant | undefined {
  const variantRef = (document as {_system?: {variant?: {_ref?: string}}})._system?.variant?._ref
  return variantRef ? variantsById.get(variantRef) : undefined
}

// Which variant a release document targets: ◆ diamond + the variant title, with the full
// conditions ("flags") on hover. Empty for base (non-variant) documents.
const VariantCell = memo(
  function VariantCell({
    document,
    variantsById,
  }: {
    document: BundleDocumentRow['document']
    variantsById: Map<string, SystemVariant>
  }) {
    const variant = resolveDocumentVariant(document, variantsById)
    if (!variant) return null

    const conditions = getVariantConditionsText(variant.conditions)

    return (
      <Tooltip
        portal
        placement="bottom-start"
        disabled={!conditions}
        content={
          conditions ? (
            <Box padding={2}>
              <Text size={1}>{conditions}</Text>
            </Box>
          ) : undefined
        }
      >
        <Flex align="center" gap={2}>
          <Card tone="suggest" padding={0} style={VARIANT_ICON_CARD_STYLE}>
            <Text size={1} style={VARIANT_ICON_STYLE}>
              <RhombusIcon />
            </Text>
          </Card>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            {getVariantTitle(variant)}
          </Text>
        </Flex>
      </Tooltip>
    )
  },
  (prev, next) => prev.document === next.document && prev.variantsById === next.variantsById,
)

export const getDocumentTableColumnDefs: (
  releaseId: string,
  releaseState: ReleaseState,
  t: TFunction<'releases'>,
  options?: {searchInCommandLane?: boolean; variantsById?: Map<string, SystemVariant>},
) => Column<BundleDocumentRow>[] = (releaseId, releaseState, t, options) => [
  /**
   * Hiding action for archived and published releases of v1.0
   * This will be added once Events API has reverse order lookup supported
   */
  ...(releaseState === 'archived' || releaseState === 'published' ? [] : [documentActionColumn(t)]),
  {
    id: 'document._type',
    // Header and body rows are independent flexboxes, so a content-sized column (width: null)
    // settles at different widths in each and misaligns. A fixed width keeps them in sync.
    // Type only ever holds short schema titles (Book / Author / demoBlogPost), and DocumentType
    // truncates + shows a tooltip on overflow, so a tighter width reclaims space for Document.
    width: 120,
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
  // "Variant" column — shows which variant each document targets. Only present when the caller
  // passes a resolved variants map (i.e. variants enabled). This is the functional point of the
  // release-detail reconciliation: the inverse of the Variants table's "Appears in" column.
  ...(options?.variantsById
    ? [
        {
          id: 'variant',
          width: 180,
          style: {minWidth: 120, maxWidth: 180},
          sorting: true,
          sortTransform(value) {
            const variant = resolveDocumentVariant(value.document, options.variantsById!)
            return variant ? getVariantTitle(variant).toLowerCase() : ''
          },
          header: (props) => (
            <Flex {...props.headerProps} paddingY={3} sizing="border">
              <Headers.SortHeaderButton text={t('table-header.variant')} {...props} />
            </Flex>
          ),
          cell: ({cellProps, datum}) => (
            <Flex align="center" {...cellProps}>
              <Box paddingX={2} style={{minWidth: 0}}>
                {!datum.isLoading && (
                  <VariantCell document={datum.document} variantsById={options.variantsById!} />
                )}
              </Box>
            </Flex>
          ),
        } satisfies Column<BundleDocumentRow>,
      ]
    : []),
  {
    id: 'search',
    width: null,
    // When search lives in the command lane, this column grows to fill (like Variants) so "Edited"
    // pins to the right edge; otherwise it holds the header search input at a capped width.
    style: options?.searchInCommandLane
      ? {minWidth: 240}
      : {minWidth: 'min(50%, calc(100vw - 80px))', maxWidth: 'min(50%, calc(100vw - 80px))'},
    sorting: options?.searchInCommandLane ? true : undefined,
    sortTransform(value) {
      return (
        String(
          value.document?.title || value.document?.name || value.document?._id,
        ).toLowerCase() || 0
      )
    },
    header: (props) =>
      options?.searchInCommandLane ? (
        // Search moved to the command lane; the header is a plain sortable "Document" label that
        // grows to fill (flex) in both header and body.
        <Flex {...props.headerProps} flex={1} paddingY={3} sizing="border">
          <Headers.SortHeaderButton text={t('table-header.document')} {...props} />
        </Flex>
      ) : (
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
    // Edited by — the last editor (person), its own named column so authorship reads distinctly
    // from live presence. Plain-text header so it aligns with the avatar at the content edge (a
    // sort button never lands its label on the same edge).
    id: 'editedBy',
    sorting: false,
    width: 170,
    style: {minWidth: 44, maxWidth: 170},
    header: ({headerProps}) => (
      <Flex {...headerProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Text muted size={1} textOverflow="ellipsis" weight="medium">
          {t('table-header.edited-by')}
        </Text>
      </Flex>
    ),
    cell: (props) => <EditedByReleaseCell {...props} releaseDocumentId={releaseId} />,
  },
  {
    id: 'document._updatedAt',
    sorting: true,
    width: 130,
    header: ({headerProps}) => (
      <Flex {...headerProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Text muted size={1} textOverflow="ellipsis" weight="medium">
          {t('table-header.last-edited')}
        </Text>
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        style={{minWidth: 130}}
        sizing="border"
      >
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
        variantId: getVariantIdFromDocument(datum.document),
        path: focusPath,
      })
      const errorLabel = t(
        validationErrorCount === 1
          ? 'document-validation.error_one'
          : 'document-validation.error_other',
        {count: validationErrorCount},
      )

      return (
        // In the command-lane layout only the Document column grows; keep validation fixed at its
        // width (flex:1 here would split the free space with Document and misalign the header/body).
        <Flex
          {...cellProps}
          flex={options?.searchInCommandLane ? undefined : 1}
          padding={1}
          justify="center"
          align="center"
          sizing="border"
        >
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
          {/* Positive "ready" state so the column is a scannable ready-vs-error rail — an empty cell
              would be ambiguous ("fine" or "not checked?"). */}
          {!datum.validation.hasError && (
            <Tooltip
              portal
              placement="bottom-end"
              content={
                <Text muted size={1}>
                  <Box padding={1}>{t('document-validation.valid')}</Box>
                </Text>
              }
            >
              <Text muted size={1} data-testid={`validation-valid-${datum.document._id}`}>
                <ToneIcon icon={CheckmarkCircleIcon} tone="positive" />
              </Text>
            </Tooltip>
          )}
        </Flex>
      )
    },
  },
]

// "Edited by" cell: the last editor's avatar + name, resolved from the release document history.
// Shares the EditedByAvatar presentation with the variant table so both read the same; presence
// (who's viewing now) stays separate in the document preview.
function EditedByReleaseCell({
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
  const {documentHistory, loading} = useReleaseHistory(historyDocumentId, bundleId, document?._rev)

  return (
    <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
      <EditedByAvatar loading={isLoading || loading} userId={documentHistory?.lastEditedBy} />
    </Flex>
  )
}
