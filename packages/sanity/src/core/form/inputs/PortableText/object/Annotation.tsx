import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {type ObjectSchemaType, type Path, type PortableTextObject} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {type ComponentType, useCallback, useMemo, useState} from 'react'

import {Tooltip} from '../../../../../ui-components'
import {pathToString} from '../../../../field'
import {useTranslation} from '../../../../i18n'
import {EMPTY_ARRAY} from '../../../../util'
import {isEmptyItem} from '../../../store/utils/isEmptyItem'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {
  type BlockAnnotationProps,
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderCustomMarkers,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {DefaultMarkers} from '../_legacyDefaultParts/Markers'
import {type SetPortableTextMemberItemElementRef} from '../contexts/PortableTextMemberItemElementRefsProvider'
import {debugRender} from '../debugRender'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {Root, TooltipBox} from './Annotation.styles'
import {AnnotationToolbarPopover} from './AnnotationToolbarPopover'

interface AnnotationProps {
  children: React.JSX.Element
  editorNodeFocused: boolean
  floatingBoundary: HTMLElement | null
  focused: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  referenceBoundary: HTMLElement | null
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  selected: boolean
  setElementRef: SetPortableTextMemberItemElementRef
  schemaType: ObjectSchemaType
  value: PortableTextObject
}

export function Annotation(props: AnnotationProps): React.JSX.Element {
  const {
    children,
    editorNodeFocused,
    floatingBoundary,
    focused,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    referenceBoundary,
    renderAnnotation,
    renderBlock,
    renderCustomMarkers,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
    selected,
    setElementRef,
    value,
  } = props
  const {Markers = DefaultMarkers} = useFormBuilder().__internal.components
  const editor = usePortableTextEditor()
  const markDefPath: Path = useMemo(
    () => path.slice(0, path.length - 2).concat(['markDefs', {_key: value._key}]),
    [path, value._key],
  )
  const [spanElement, setSpanElement] = useState<HTMLSpanElement | null>(null)
  const memberItem = usePortableTextMemberItem(pathToString(markDefPath))
  const {validation} = useMemberValidation(memberItem?.node)
  const markers = usePortableTextMarkers(path)

  const text = useMemo(() => <span data-annotation="">{children}</span>, [children])

  const onOpen = useCallback(() => {
    if (memberItem) {
      // Take focus away from the editor so it doesn't accidentally propagate a new focusPath
      // for the text node that the annotation is attached to.
      PortableTextEditor.blur(editor)
      // Open the annotation item (markDef object)
      onItemOpen(memberItem.node.path)
    }
  }, [editor, memberItem, onItemOpen])

  const onClose = useCallback(() => {
    onItemClose()
    if (isEmptyItem(value)) {
      PortableTextEditor.removeAnnotation(editor, schemaType)
    }
    PortableTextEditor.focus(editor)
  }, [editor, onItemClose, schemaType, value])

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
            <TooltipBox>
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
    [Markers, markers, renderCustomMarkers, text, validation],
  )

  const presence = useChildPresence(path, true)
  const rootPresence = useMemo(
    () => presence.filter((p) => isEqual(p.path, path)),
    [path, presence],
  )

  const isOpen = Boolean(memberItem?.member.open)
  const input = memberItem?.input
  const nodePath = memberItem?.node.path || EMPTY_ARRAY
  const referenceElement = spanElement

  const componentProps = useMemo(
    (): BlockAnnotationProps => ({
      __unstable_floatingBoundary: floatingBoundary,
      __unstable_referenceBoundary: referenceBoundary,
      __unstable_referenceElement: referenceElement,
      __unstable_textElementFocus: editorNodeFocused, // Is there focus on the related text element for this object?
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
      presence: rootPresence,
      readOnly: Boolean(readOnly),
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderPreview,
      renderItem,
      renderDefault: DefaultAnnotationComponent,
      schemaType,
      selected,
      textElement: markersToolTip || text,
      validation,
      value,
    }),
    [
      editor.schemaTypes.block,
      editorNodeFocused,
      floatingBoundary,
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
      text,
      validation,
      value,
    ],
  )

  const CustomComponent = schemaType.components?.annotation as
    | ComponentType<BlockAnnotationProps>
    | undefined

  const setRef = useCallback(
    (elm: HTMLSpanElement) => {
      if (memberItem) {
        setElementRef({key: memberItem.member.key, elementRef: elm})
      }
      setSpanElement(elm) // update state here so the reference element is available on first render
    },
    [memberItem, setElementRef, setSpanElement],
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
    [CustomComponent, componentProps, setRef],
  )
}

export const DefaultAnnotationComponent = (props: BlockAnnotationProps): React.JSX.Element => {
  const {
    __unstable_floatingBoundary: floatingBoundary,
    __unstable_referenceBoundary: referenceBoundary,
    __unstable_referenceElement: referenceElement,
    children,
    markers,
    onOpen,
    onRemove,
    open,
    readOnly,
    schemaType,
    selected,
    textElement,
    validation,
  } = props
  const isLink = schemaType.name === 'link'
  const hasError = validation.some((v) => v.level === 'error')
  const hasWarning = validation.some((v) => v.level === 'warning')
  const hasMarkers = markers.length > 0
  const isReady = Boolean(children)

  const {t} = useTranslation()

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
      aria-label={t('inputs.portable-text.annotation-aria-label')}
      data-link={isLink ? '' : undefined}
      data-error={hasError ? '' : undefined}
      data-warning={hasWarning ? '' : undefined}
      data-markers={hasMarkers || undefined}
      onClick={readOnly ? onOpen : undefined}
    >
      {textElement}
      {isReady && (
        <AnnotationToolbarPopover
          annotationOpen={open}
          floatingBoundary={floatingBoundary}
          onOpenAnnotation={onOpen}
          onRemoveAnnotation={onRemove}
          referenceBoundary={referenceBoundary}
          referenceElement={referenceElement}
          annotationTextSelected={selected}
          title={
            schemaType.i18nTitleKey
              ? t(schemaType.i18nTitleKey)
              : schemaType.title || schemaType.name
          }
        />
      )}
    </Root>
  )
}
