import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path, PortableTextObject} from '@sanity/types'
import {Tooltip} from '@sanity/ui'
import React, {ComponentType, useCallback, useMemo, useState} from 'react'
import {isEqual} from '@sanity/util/paths'
import {pathToString} from '../../../../field'
import {BlockAnnotationProps, RenderCustomMarkers} from '../../../types'
import {DefaultMarkers} from '../_legacyDefaultParts/Markers'
import {useFormBuilder} from '../../../useFormBuilder'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {debugRender} from '../debugRender'
import {EMPTY_ARRAY} from '../../../../util'
import {AnnotationToolbarPopover} from './AnnotationToolbarPopover'
import {Root, TooltipBox} from './Annotation.styles'
import {ObjectEditModal} from './modals/ObjectEditModal'

interface AnnotationProps {
  boundaryElement: HTMLElement | null
  children: React.ReactElement
  focused: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  renderCustomMarkers?: RenderCustomMarkers
  selected: boolean
  schemaType: ObjectSchemaType
  value: PortableTextObject
}

export function Annotation(props: AnnotationProps) {
  const {
    boundaryElement,
    children,
    focused,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    renderCustomMarkers,
    schemaType,
    selected,
    value,
  } = props
  const {Markers = DefaultMarkers} = useFormBuilder().__internal.components
  const editor = usePortableTextEditor()
  const markDefPath: Path = useMemo(
    () => path.slice(0, path.length - 2).concat(['markDefs', {_key: value._key}]),
    [path, value._key]
  )
  const [spanElm, setSpanElm] = useState<HTMLSpanElement | null>(null)
  const spanPath: Path = useMemo(() => path.slice(path.length - 3, path.length), [path])
  const memberItem = usePortableTextMemberItem(pathToString(markDefPath))
  const {validation} = useMemberValidation(memberItem?.node)
  const markers = usePortableTextMarkers(path)

  const text = useMemo(() => <span data-annotation="">{children}</span>, [children])

  const onOpen = useCallback(() => {
    if (memberItem) {
      PortableTextEditor.blur(editor)
      onItemOpen(memberItem.node.path)
    }
  }, [editor, onItemOpen, memberItem])

  const onClose = useCallback(() => {
    onItemClose()
    // Keep track of any previous offsets on the spanNode before we select it.
    const sel = PortableTextEditor.getSelection(editor)
    const focusOffset = sel?.focus.path && isEqual(sel.focus.path, spanPath) && sel.focus.offset
    const anchorOffset = sel?.anchor.path && isEqual(sel.anchor.path, spanPath) && sel.anchor.offset
    PortableTextEditor.select(editor, {
      anchor: {path: spanPath, offset: anchorOffset || 0},
      focus: {path: spanPath, offset: focusOffset || 0},
    })
    PortableTextEditor.focus(editor)
  }, [editor, spanPath, onItemClose])

  const onRemove = useCallback(() => {
    PortableTextEditor.removeAnnotation(editor, schemaType)
    PortableTextEditor.focus(editor)
  }, [editor, schemaType])

  const markersToolTip = useMemo(
    () =>
      validation.length > 0 || markers.length > 0 ? (
        <Tooltip
          placement="bottom"
          portal="default"
          content={
            <TooltipBox padding={2}>
              <Markers
                markers={markers}
                renderCustomMarkers={renderCustomMarkers}
                validation={validation}
              />
            </TooltipBox>
          }
        >
          {text}
        </Tooltip>
      ) : undefined,
    [Markers, markers, renderCustomMarkers, text, validation]
  )

  const presence = memberItem?.node.presence || EMPTY_ARRAY

  const isOpen = Boolean(memberItem?.member.open)
  const input = memberItem?.input
  const nodePath = memberItem?.node.path || EMPTY_ARRAY
  const referenceElement = spanElm

  const componentProps = useMemo(
    (): BlockAnnotationProps => ({
      __unstable_boundaryElement: boundaryElement || undefined,
      __unstable_referenceElement: referenceElement || undefined,
      children: input,
      focused,
      markers,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: isOpen,
      parentSchemaType: editor.schemaTypes.block,
      path: nodePath,
      presence,
      readOnly: Boolean(readOnly),
      renderDefault: DefaultAnnotationComponent,
      schemaType,
      selected,
      textElement: markersToolTip || text,
      validation,
      value,
    }),
    [
      boundaryElement,
      editor.schemaTypes.block,
      focused,
      input,
      isOpen,
      markers,
      markersToolTip,
      nodePath,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      presence,
      readOnly,
      referenceElement,
      schemaType,
      selected,
      text,
      validation,
      value,
    ]
  )

  const CustomComponent = schemaType.components?.annotation as
    | ComponentType<BlockAnnotationProps>
    | undefined

  const setRef = useCallback(
    (elm: HTMLSpanElement) => {
      if (memberItem?.elementRef) {
        memberItem.elementRef.current = elm
      }
      setSpanElm(elm) // update state here so the reference element is available on first render
    },
    [memberItem]
  )

  return useMemo(
    () => (
      <span ref={setRef} style={debugRender()}>
        {CustomComponent ? (
          <CustomComponent {...componentProps} />
        ) : (
          <DefaultAnnotationComponent {...componentProps} />
        )}
      </span>
    ),
    [CustomComponent, componentProps, setRef]
  )
}

export const DefaultAnnotationComponent = (props: BlockAnnotationProps) => {
  const {
    __unstable_boundaryElement,
    __unstable_referenceElement,
    children,
    markers,
    onClose,
    onOpen,
    onRemove,
    open,
    path,
    readOnly,
    schemaType,
    textElement,
    validation,
    value,
  } = props
  const isLink = schemaType.name === 'link'
  const hasError = validation.filter((v) => v.level === 'error').length > 0
  const hasWarning = validation.filter((v) => v.level === 'warning').length > 0
  const hasMarkers = markers.length > 0
  const autofocus = isEqual(path.slice(-2), ['markDefs', {_key: value._key}])

  const toneKey = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (hasWarning) {
      return 'caution'
    }

    if (isLink) {
      return 'primary'
    }
    return 'default'
  }, [isLink, hasError, hasWarning])

  return (
    <Root
      $toneKey={toneKey}
      data-link={isLink ? '' : undefined}
      data-error={hasError ? '' : undefined}
      data-warning={hasWarning ? '' : undefined}
      data-markers={hasMarkers || undefined}
      onClick={readOnly ? onOpen : undefined}
    >
      {textElement}
      <AnnotationToolbarPopover
        referenceElement={__unstable_referenceElement}
        boundaryElement={__unstable_boundaryElement}
        onOpen={onOpen}
        onRemove={onRemove}
        title={schemaType.title || schemaType.name}
      />
      {open && (
        <ObjectEditModal
          boundaryElement={__unstable_boundaryElement}
          defaultType="popover"
          onClose={onClose}
          autofocus={autofocus}
          referenceElement={__unstable_referenceElement}
          schemaType={schemaType}
        >
          {children}
        </ObjectEditModal>
      )}
    </Root>
  )
}
