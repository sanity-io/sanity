import {hues} from '@sanity/color'
import {
  BlockAnnotationRenderProps,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {Box, Theme, ThemeColorToneKey, Tooltip} from '@sanity/ui'
import React, {ComponentType, SyntheticEvent, useCallback, useMemo, useRef} from 'react'
import styled, {css} from 'styled-components'
import {pathToString} from '../../../../field'
import {BlockAnnotationProps, RenderCustomMarkers} from '../../../types'
import {DefaultMarkers} from '../_legacyDefaultParts/Markers'
import {useFormBuilder} from '../../../useFormBuilder'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {debugRender} from '../debugRender'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {EMPTY_ARRAY} from '../../../../util'
import {AnnotationToolbarPopover} from './AnnotationToolbarPopover'

interface AnnotationProps {
  renderProps: BlockAnnotationRenderProps
  onItemOpen: (path: Path) => void
  onItemClose: () => void
  readOnly?: boolean
  renderCustomMarkers?: RenderCustomMarkers
  scrollElement: HTMLElement | null
}

const Root = styled.span<{$toneKey?: Exclude<ThemeColorToneKey, 'transparent'>}>(
  (props: {$toneKey?: Exclude<ThemeColorToneKey, 'transparent'>; theme: Theme}) => {
    const {$toneKey = 'default', theme} = props

    return css`
      text-decoration: none;
      display: inline;
      background-color: ${theme.sanity.color.selectable?.[$toneKey].enabled.bg};
      border-bottom: 1px dashed ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};
      color: ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};

      &[data-link] {
        border-bottom: 1px solid ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};
      }

      &[data-custom-markers] {
        background-color: ${theme.sanity.color.dark ? hues.purple[950].hex : hues.purple[50].hex};
      }

      &[data-warning] {
        background-color: ${theme.sanity.color.muted.caution.hovered.bg};
      }

      &[data-error] {
        background-color: ${theme.sanity.color.muted.critical.hovered.bg};
      }
    `
  }
)

const TooltipBox = styled(Box).attrs({forwardedAs: 'span'})`
  max-width: 250px;
`

export const Annotation = function Annotation(props: AnnotationProps) {
  const {onItemOpen, onItemClose, renderCustomMarkers, scrollElement, renderProps, readOnly} = props
  const {children, schemaType, value, path, focused, selected} = renderProps
  const {Markers = DefaultMarkers} = useFormBuilder().__internal.components
  const annotationRef = useRef<HTMLElement>(null)
  const editor = usePortableTextEditor()
  const markDefPath = useMemo(
    () => [path[0]].concat(['markDefs', {_key: value._key}]),
    [path, value._key]
  )
  const memberItem = usePortableTextMemberItem(pathToString(markDefPath))
  const {validation, hasError, hasWarning} = useMemberValidation(memberItem?.node)
  const markers = usePortableTextMarkers(path)
  const textElement = useRef<HTMLSpanElement | null>(null)
  const hasCustomMarkers = markers.length > 0

  const text = useMemo(
    () => (
      <span ref={textElement} data-annotation="">
        {children}
      </span>
    ),

    [children]
  )

  const openItem = useCallback(() => {
    if (memberItem) {
      onItemOpen(memberItem.node.path)
    }
  }, [memberItem, onItemOpen])

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
          <span>{text}</span>
        </Tooltip>
      ) : undefined,
    [Markers, markers, renderCustomMarkers, text, validation]
  )

  const handleEditClick = useCallback(
    (event: SyntheticEvent): void => {
      PortableTextEditor.blur(editor)
      event.preventDefault()
      event.stopPropagation()
      openItem()
    },
    [editor, openItem]
  )

  const handleRemoveClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      PortableTextEditor.removeAnnotation(editor, schemaType)
      PortableTextEditor.focus(editor)
    },
    [editor, schemaType]
  )

  const isLink = schemaType.name === 'link'

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

  const DefaultComponent = useCallback(
    (defaultComponentProps: BlockAnnotationProps) => (
      <Root
        $toneKey={toneKey}
        ref={annotationRef}
        data-link={isLink ? '' : undefined}
        data-error={hasError ? '' : undefined}
        data-warning={hasWarning ? '' : undefined}
        data-custom-markers={hasCustomMarkers ? '' : undefined}
        onClick={readOnly ? openItem : undefined}
      >
        {defaultComponentProps.children}
        <AnnotationToolbarPopover
          textElement={textElement.current || undefined}
          annotationElement={annotationRef.current || undefined}
          scrollElement={scrollElement || undefined}
          onEdit={handleEditClick}
          onDelete={handleRemoveClick}
          title={schemaType.title || schemaType.name}
        />
      </Root>
    ),
    [
      handleEditClick,
      handleRemoveClick,
      hasCustomMarkers,
      hasError,
      hasWarning,
      isLink,
      openItem,
      readOnly,
      schemaType.name,
      schemaType.title,
      scrollElement,
      toneKey,
    ]
  )
  const onRemove = useCallback(() => {
    PortableTextEditor.removeAnnotation(editor, schemaType)
    PortableTextEditor.focus(editor)
  }, [editor, schemaType])

  const presence = useChildPresence(memberItem?.node.path || EMPTY_ARRAY, !!memberItem)

  const content = useMemo(() => {
    if (!memberItem) {
      return null
    }
    const componentProps: Omit<BlockAnnotationProps, 'children'> = {
      __unstable_boundaryElement: scrollElement || undefined,
      __unstable_referenceElement: memberItem?.elementRef?.current || undefined,
      focused,
      onClose: onItemClose,
      onOpen: openItem,
      onRemove,
      open: memberItem?.member.open || false,
      path: memberItem?.node.path || path,
      presence,
      renderDefault: DefaultComponent,
      schemaType,
      selected,
      validation,
      value,
    }
    const CustomComponent = schemaType.components?.annotation as
      | ComponentType<BlockAnnotationProps>
      | undefined

    return CustomComponent ? (
      <CustomComponent {...componentProps}>{markersToolTip || text}</CustomComponent>
    ) : (
      <DefaultComponent {...componentProps}>{markersToolTip || text}</DefaultComponent>
    )
  }, [
    DefaultComponent,
    focused,
    markersToolTip,
    memberItem,
    onItemClose,
    onRemove,
    openItem,
    path,
    presence,
    schemaType,
    scrollElement,
    selected,
    text,
    validation,
    value,
  ])
  return useMemo(
    () => (
      <span ref={memberItem?.elementRef} style={debugRender()}>
        <span ref={annotationRef}>{content}</span>
      </span>
    ),
    [content, memberItem?.elementRef]
  )
}
