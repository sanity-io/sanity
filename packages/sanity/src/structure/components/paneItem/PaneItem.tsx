import {ChevronRightIcon, DocumentIcon, FolderIcon, SparklesIcon} from '@sanity/icons'
import {
  isSanityDocument,
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {Box, type CardProps, Checkbox, Flex, Text} from '@sanity/ui'
import {
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ContextMenuButton,
  type FIXME,
  type GeneralPreviewLayoutKey,
  getAnyPendingProposal,
  getPublishedId,
  PreviewCard,
  SanityDefaultPreview,
  useConfidenceStoreVersion,
  useDocumentPresence,
  useDocumentPreviewStore,
  useEditState,
  useSchema,
  useTranslation,
} from 'sanity'
import {styled} from 'styled-components'

import {structureLocaleNamespace} from '../../i18n'
import {useDocumentListSelection} from '../../panes/documentList/selection/DocumentListSelectionProvider'
import {MissingSchemaType} from '../MissingSchemaType'
import {usePaneRouter} from '../paneRouter'
import {PaneItemPreview} from './PaneItemPreview'

interface PaneItemProps {
  id: string
  layout?: GeneralPreviewLayoutKey
  icon?: ComponentType<any> | false
  pressed?: boolean
  selected?: boolean
  sortOrder?: Pick<SortOrdering, 'by'>
  title?: string
  value?: PreviewValue | SanityDocument
  schemaType?: SchemaType
  margin?: CardProps['margin']
  marginBottom?: CardProps['marginBottom']
  marginTop?: CardProps['marginTop']
}

/**
 * Return `false` if we explicitly disable the icon.
 * Otherwise return the passed icon or the schema type icon as a backup.
 */
function getIconWithFallback(
  icon: ComponentType<any> | false | undefined,
  schemaType: SchemaType | undefined,
  defaultIcon: ComponentType<any>,
): ComponentType<any> | false {
  if (icon === false) {
    return false
  }

  return icon || (schemaType && schemaType.icon) || defaultIcon || false
}

// Selectable rows reserve a fixed-width selection gutter so nothing shifts
// on hover: the checkbox fades in (hover/focus/selection mode/selected) but
// its space is always there, giving a large, stable click target. It is only
// clickable while visible (pointer-events), so the hidden state can't
// swallow row clicks. The overflow trigger overlays the row's end on hover
// instead of participating in layout — again, no shift.
const Root = styled(PreviewCard)`
  position: relative;

  [data-ui='PaneItemSelect'] {
    opacity: 0;
    pointer-events: none;
    transition: opacity 100ms ease;
  }

  &:hover [data-ui='PaneItemSelect'],
  &:focus-within [data-ui='PaneItemSelect'],
  &[data-selection-active] [data-ui='PaneItemSelect'],
  &[data-row-selected] [data-ui='PaneItemSelect'] {
    opacity: 1;
    pointer-events: auto;
  }

  [data-ui='PaneItemMenuTrigger'] {
    opacity: 0;
    pointer-events: none;
    transition: opacity 100ms ease;
  }

  &:hover [data-ui='PaneItemMenuTrigger'],
  &:focus-within [data-ui='PaneItemMenuTrigger'] {
    opacity: 1;
    pointer-events: auto;
  }
`

export function PaneItem(props: PaneItemProps) {
  const {
    icon,
    id,
    layout = 'default',
    pressed,
    schemaType,
    selected,
    sortOrder,
    title,
    value,
    margin,
    marginBottom,
    marginTop,
  } = props
  const schema = useSchema()
  const documentPreviewStore = useDocumentPreviewStore()
  const {ChildLink} = usePaneRouter()
  const documentPresence = useDocumentPresence(id)
  const {t} = useTranslation(structureLocaleNamespace)
  const hasSchemaType = Boolean(schemaType && schemaType.name && schema.get(schemaType.name))
  const [clicked, setClicked] = useState<boolean>(false)

  const rowRef = useRef<HTMLDivElement | null>(null)

  // The document list selection model, when this row renders inside a
  // document list pane. `null` elsewhere — the row is then purely
  // navigational, exactly as before.
  const listSelection = useDocumentListSelection()
  const isDocumentRow = Boolean(value && isSanityDocument(value) && hasSchemaType)
  const selectable = Boolean(listSelection && isDocumentRow && schemaType?.name)
  const selectionActive = Boolean(listSelection?.selectionActive)
  const rowSelected = selectable ? listSelection!.isSelected(id) : false

  // Ambient agent marker (confidence prototype): the row shows a sparkle
  // while the mock agent has a pending proposal on this document.
  useConfidenceStoreVersion()
  const pendingProposal =
    selectable && schemaType?.name ? getAnyPendingProposal(id, schemaType.name) : null

  const preview = useMemo(() => {
    if (value && isSanityDocument(value)) {
      if (!schemaType || !hasSchemaType) {
        return <MissingSchemaType value={value} />
      }

      return (
        <PaneItemPreview
          documentPreviewStore={documentPreviewStore}
          icon={getIconWithFallback(icon, schemaType, DocumentIcon)}
          layout={layout}
          schemaType={schemaType}
          sortOrder={sortOrder}
          value={value}
          presence={documentPresence}
        />
      )
    }

    // Always render non-document values as compact previews
    return (
      <SanityDefaultPreview
        status={
          <Box style={{opacity: 0.5}}>
            <Text muted size={1}>
              <ChevronRightIcon />
            </Text>
          </Box>
        }
        icon={getIconWithFallback(icon, schemaType, FolderIcon)}
        layout="compact"
        title={title}
      />
    )
  }, [
    documentPreviewStore,
    hasSchemaType,
    icon,
    layout,
    schemaType,
    sortOrder,
    title,
    value,
    documentPresence,
  ])

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (selectable && listSelection) {
        // Cmd/Ctrl-click toggles the row in and out of the selection.
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          listSelection.toggle(id)
          return
        }
        // Shift-click extends the selection while in selection mode.
        if (e.shiftKey && selectionActive) {
          e.preventDefault()
          listSelection.selectRange(id)
          return
        }
        // While in selection mode, plain click toggles; navigation resumes
        // once the selection is cleared (Escape or the bar's Clear).
        if (selectionActive) {
          e.preventDefault()
          listSelection.toggle(id)
          return
        }
      }

      if (e.metaKey) {
        setClicked(false)
        return
      }

      setClicked(true)
    },
    [id, listSelection, selectable, selectionActive],
  )

  const handleCheckboxClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      listSelection?.toggle(id)
    },
    [id, listSelection],
  )

  const openItemMenu = useCallback(
    (translate: {x: number; y: number} | null) => {
      if (!listSelection || !rowRef.current || !schemaType?.name) return
      listSelection.openItemMenu({
        documentId: id,
        documentType: schemaType.name,
        element: rowRef.current,
        translate,
      })
    },
    [id, listSelection, schemaType],
  )

  const handleContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!selectable) return
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      openItemMenu({x: e.clientX - rect.left, y: rect.top - e.clientY})
    },
    [openItemMenu, selectable],
  )

  const handleMenuTriggerClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      openItemMenu(null)
    },
    [openItemMenu],
  )

  // Keyboard equivalent of right-click (menu key / Shift+F10) when the row
  // has real focus.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!selectable) return
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault()
        openItemMenu(null)
      }
    },
    [openItemMenu, selectable],
  )

  // Reset `clicked` state when `selected` prop changes
  // oxlint-disable-next-line react/react-compiler
  useEffect(() => setClicked(false), [selected])

  // Preloads the edit state on hover, using concurrent rendering with `startTransition` so preloads can be interrupted and not block rendering
  const [preloading, setPreload] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => startTransition(() => setPreload(true)), 400)
  }, [])
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    startTransition(() => setPreload(false))
  }, [])

  return (
    <Root
      data-testid={`pane-item-${title}`}
      __unstable_focusRing
      // `forwardedAs` (not `as`) so styled-components keeps rendering
      // PreviewCard and the polymorphic `as` reaches the Card layer
      forwardedAs={ChildLink as FIXME}
      childId={id}
      data-as="a"
      data-selection-active={selectionActive ? '' : undefined}
      data-row-selected={rowSelected ? '' : undefined}
      margin={margin}
      marginBottom={marginBottom}
      marginTop={marginTop}
      onClick={handleClick}
      onContextMenu={selectable ? handleContextMenu : undefined}
      onKeyDown={selectable ? handleKeyDown : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      pressed={pressed}
      radius={2}
      ref={rowRef}
      selected={selected || clicked}
      sizing="border"
      tabIndex={-1}
      // selection-for-operation gets its own tint, distinct from the solid
      // "open document" highlight — the two states mean different things
      tone={rowSelected ? 'primary' : 'inherit'}
    >
      {selectable ? (
        <Flex align="stretch">
          <Flex
            align="center"
            data-ui="PaneItemSelect"
            flex="none"
            justify="center"
            onClick={handleCheckboxClick}
            style={{width: 27}}
          >
            {/* purely visual: @sanity/ui Checkbox swallows click propagation
                in the React tree, so the gutter Flex owns the click target */}
            <Checkbox
              aria-label={t('panes.document-list-pane.item.select.aria-label')}
              checked={rowSelected}
              readOnly
              style={{pointerEvents: 'none'}}
              tabIndex={-1}
            />
          </Flex>
          <Box flex={1} style={{minWidth: 0}}>
            {preview}
          </Box>
          {pendingProposal && (
            <Flex
              align="center"
              flex="none"
              paddingX={1}
              // oxlint-disable-next-line @sanity/i18n/no-attribute-template-literals -- confidence prototype, not for upstream
              title={`Agent proposal pending — acting as ${pendingProposal.hat}`}
            >
              <Text muted size={1}>
                <SparklesIcon />
              </Text>
            </Flex>
          )}
          {/* dedicated overflow zone, mirror of the selection gutter: space
              is always reserved so revealing the trigger never shifts layout */}
          <Flex
            align="center"
            data-ui="PaneItemMenuTrigger"
            flex="none"
            justify="center"
            paddingRight={1}
          >
            <ContextMenuButton
              onClick={handleMenuTriggerClick}
              tooltipProps={{
                content: t('panes.document-list-pane.item.menu.tooltip'),
              }}
            />
          </Flex>
        </Flex>
      ) : (
        preview
      )}
      {preloading && schemaType?.name && value && isSanityDocument(value) && (
        <PreloadDocumentPane documentId={id} documentType={schemaType.name} />
      )}
    </Root>
  )
}

function PreloadDocumentPane(props: {documentId: string; documentType: string}) {
  const {documentId, documentType} = props
  // Preload the edit state for the document, and keep it alive until mouse leave
  useEditState(getPublishedId(documentId), documentType)

  return null
}
PreloadDocumentPane.displayName = 'PreloadDocumentPane'
