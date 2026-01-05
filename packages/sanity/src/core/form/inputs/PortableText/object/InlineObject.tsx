import {type EditorSelection, PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
  type PortableTextChild,
} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useCallback, useMemo, useState} from 'react'

import {Tooltip} from '../../../../../ui-components'
import {pathToString} from '../../../../field/paths'
import {useTranslation} from '../../../../i18n'
import {EMPTY_ARRAY} from '../../../../util'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {
  type BlockProps,
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderCustomMarkers,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {type SetPortableTextMemberItemElementRef} from '../contexts/PortableTextMemberItemElementRefsProvider'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {PreviewSpan, Root, TooltipBox} from './InlineObject.styles'
import {InlineObjectToolbarPopover} from './InlineObjectToolbarPopover'
import {ObjectEditModal} from './modals/ObjectEditModal'

interface InlineObjectProps {
  floatingBoundary: HTMLElement | null
  focused: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  referenceBoundary: HTMLElement | null
  relativePath: Path
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean
  setElementRef: SetPortableTextMemberItemElementRef
  value: PortableTextChild
}

export const InlineObject = (props: InlineObjectProps): React.JSX.Element => {
  const {
    floatingBoundary,
    focused,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    referenceBoundary,
    relativePath,
    renderAnnotation,
    renderBlock,
    renderCustomMarkers,
    renderField,
    renderItem,
    renderInlineBlock,
    renderInput,
    renderPreview,
    schemaType,
    selected,
    setElementRef,
    value,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const editor = usePortableTextEditor()
  const markers = usePortableTextMarkers(path)
  const [divElement, setDivElement] = useState<HTMLDivElement | null>(null)
  const memberItem = usePortableTextMemberItem(pathToString(path))
  const {validation, hasError, hasInfo, hasWarning} = useMemberValidation(memberItem?.node)
  const parentSchemaType = editor.schemaTypes.block
  const hasMarkers = markers.length > 0
  const selfSelection = useMemo(
    (): EditorSelection => ({
      anchor: {path: relativePath, offset: 0},
      focus: {path: relativePath, offset: 0},
    }),
    [relativePath],
  )

  const onRemove = useCallback(() => {
    PortableTextEditor.delete(editor, selfSelection, {mode: 'children'})
    PortableTextEditor.focus(editor)
  }, [selfSelection, editor])

  const onOpen = useCallback(() => {
    if (memberItem) {
      // Take focus away from the editor so that it doesn't propagate a new focusPath and interfere here.
      PortableTextEditor.blur(editor)
      onItemOpen(memberItem.node.path)
    }
  }, [onItemOpen, editor, memberItem])

  const onClose = useCallback(() => {
    onItemClose()
    PortableTextEditor.select(editor, selfSelection)
    PortableTextEditor.focus(editor)
  }, [onItemClose, editor, selfSelection])

  const isOpen = Boolean(memberItem?.member.open)
  const input = memberItem?.input
  const nodePath = memberItem?.node.path || EMPTY_ARRAY
  const referenceElement = divElement

  const presence = useChildPresence(path, true)
  const rootPresence = useMemo(
    () => presence.filter((p) => isEqual(p.path, path)),
    [path, presence],
  )

  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_floatingBoundary: floatingBoundary,
      __unstable_referenceBoundary: referenceBoundary,
      __unstable_referenceElement: referenceElement,
      children: input,
      focused,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: isOpen,
      markers,
      member: memberItem?.member,
      parentSchemaType,
      path: nodePath,
      presence: rootPresence,
      readOnly: Boolean(readOnly),
      renderAnnotation,
      renderBlock,
      renderDefault: DefaultInlineObjectComponent,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      selected,
      value: value as PortableTextBlock,
      validation,
    }),
    [
      floatingBoundary,
      focused,
      input,
      isOpen,
      markers,
      memberItem?.member,
      nodePath,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      parentSchemaType,
      readOnly,
      referenceBoundary,
      referenceElement,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      rootPresence,
      schemaType,
      selected,
      validation,
      value,
    ],
  )

  // Tooltip indicating validation errors, warnings, info and markers
  const tooltipEnabled = hasError || hasWarning || hasInfo || hasMarkers
  const toolTipContent = useMemo(
    () =>
      (tooltipEnabled && (
        <TooltipBox>
          <Markers
            markers={markers}
            validation={validation}
            renderCustomMarkers={renderCustomMarkers}
          />
        </TooltipBox>
      )) ||
      null,
    [Markers, markers, renderCustomMarkers, tooltipEnabled, validation],
  )

  const setRef = useCallback(
    (elm: HTMLDivElement) => {
      if (memberItem) {
        setElementRef({key: memberItem.member.key, elementRef: elm})
      }
      setDivElement(elm) // update state here so the reference element is available on first render
    },
    [memberItem, setElementRef, setDivElement],
  )

  return useMemo(
    () => (
      <span ref={setRef} contentEditable={false}>
        <Tooltip
          placement="bottom"
          portal="editor"
          // If the object modal is open, disable the tooltip to avoid it rerendering the inner items when the validation changes.
          disabled={isOpen ? true : !tooltipEnabled}
          content={toolTipContent}
        >
          {/* This relative span must be here for the ToolTip to properly show */}
          {renderInlineBlock && (
            <span style={{position: 'relative'}}>{renderInlineBlock(componentProps)}</span>
          )}
        </Tooltip>
      </span>
    ),
    [componentProps, renderInlineBlock, setRef, toolTipContent, tooltipEnabled, isOpen],
  )
}

export const DefaultInlineObjectComponent = (props: BlockProps): React.JSX.Element => {
  const {
    __unstable_floatingBoundary: floatingBoundary,
    __unstable_referenceBoundary: referenceBoundary,
    __unstable_referenceElement: referenceElement,
    children,
    focused,
    markers,
    onClose,
    onOpen,
    onRemove,
    open,
    readOnly,
    renderPreview,
    schemaType,
    selected,
    validation,
    value,
  } = props
  const {t} = useTranslation()
  const hasMarkers = markers.length > 0
  const popoverTitle = schemaType?.title || schemaType.name
  const hasError = validation.filter((v) => v.level === 'error').length > 0
  const hasWarning = validation.filter((v) => v.level === 'warning').length > 0

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (hasWarning) {
      return 'caution'
    }

    if (selected || focused) {
      return 'primary'
    }
    return undefined
  }, [focused, hasError, hasWarning, selected])

  return (
    <>
      <Root
        aria-label={t('inputs.portable-text.inline-block.aria-label')}
        data-focused={focused || undefined}
        data-invalid={hasError || undefined}
        data-markers={hasMarkers || undefined}
        data-read-only={readOnly || undefined}
        data-selected={selected || undefined}
        data-warning={hasWarning || undefined}
        forwardedAs="span"
        onClick={readOnly ? onOpen : undefined}
        onDoubleClick={onOpen}
        tone={tone}
      >
        <PreviewSpan>
          {renderPreview({
            layout: 'inline',
            schemaType,
            skipVisibilityCheck: true,
            value,
            fallbackTitle: 'Click to edit',
          })}
        </PreviewSpan>
      </Root>
      {referenceElement && (
        <InlineObjectToolbarPopover
          floatingBoundary={floatingBoundary}
          inlineObjectFocused={focused}
          inlineObjectOpen={open}
          onOpenInlineObject={onOpen}
          onRemoveInlineObject={onRemove}
          referenceBoundary={referenceBoundary}
          referenceElement={referenceElement}
          title={popoverTitle}
        />
      )}
      {open && (
        <ObjectEditModal
          autoFocus
          defaultType="popover"
          floatingBoundary={floatingBoundary}
          onClose={onClose}
          referenceBoundary={referenceBoundary}
          referenceElement={referenceElement}
          schemaType={schemaType}
        >
          {children}
        </ObjectEditModal>
      )}
    </>
  )
}
