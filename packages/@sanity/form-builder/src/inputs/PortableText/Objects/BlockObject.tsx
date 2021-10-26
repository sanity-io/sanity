import {
  PortableTextEditor,
  PortableTextBlock,
  Type,
  RenderAttributes,
} from '@sanity/portable-text-editor'
import {isKeySegment, Marker, Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Card, Theme, Tooltip, Stack} from '@sanity/ui'
import {hues} from '@sanity/color'
import React, {useCallback, useMemo, useRef} from 'react'
import styled, {css} from 'styled-components'
import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {hasFocusWithinPath} from '../../../utils/focusUtils'
import {RenderBlockActions, RenderCustomMarkers} from '../types'
import Markers from '../legacyParts/Markers'
import {BlockObjectPreview} from './BlockObjectPreview'

interface BlockObjectProps {
  attributes: RenderAttributes
  blockRef?: React.RefObject<HTMLDivElement>
  editor: PortableTextEditor
  markers: Marker[]
  onFocus: (path: Path) => void
  focusPath: Path
  readOnly: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  type: Type
  value: PortableTextBlock
}

const Root = styled(Card)((props: {theme: Theme}) => {
  const {color, radius} = props.theme.sanity

  const overlay = css`
    pointer-events: none;
    content: '';
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border-radius: ${radius[2]}px;
    mix-blend-mode: ${color.dark ? 'screen' : 'multiply'};
  `

  return css`
    box-shadow: 0 0 0 1px var(--card-border-color);
    border-radius: ${radius[1]}px;
    pointer-events: all;
    position: relative;

    &[data-focused] {
      box-shadow: 0 0 0 1px ${color.selectable.primary.selected.border};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.default.hovered.border};
        }
      }
    }

    &[data-markers] {
      &:after {
        ${overlay}
        background-color: ${color.dark ? hues.purple[950].hex : hues.purple[50].hex};
      }
    }

    &[data-invalid] {
      &:after {
        ${overlay}
        background-color: ${color.input.invalid.enabled.bg};
      }

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.invalid.hovered.border};
        }
      }
    }
  `
})

export function BlockObject(props: BlockObjectProps) {
  const {
    attributes: {focused, selected, path},
    blockRef,
    editor,
    focusPath,
    markers,
    onFocus,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    type,
    value,
  } = props
  const elementRef = useRef<HTMLDivElement>()

  useScrollIntoViewOnFocusWithin(elementRef, hasFocusWithinPath(focusPath, value))

  const handleClickToOpen = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (focused) {
        event.preventDefault()
        event.stopPropagation()
        onFocus(path.concat(FOCUS_TERMINATOR))
      } else {
        onFocus(path)
      }
    },
    [focused, onFocus, path]
  )

  const handleEdit = useCallback((): void => {
    onFocus(path.concat(FOCUS_TERMINATOR))
  }, [onFocus, path])

  const handleDelete = useCallback(
    () => (): void => {
      PortableTextEditor.delete(
        editor,
        {focus: {path, offset: 0}, anchor: {path, offset: 0}},
        {mode: 'block'}
      )
      PortableTextEditor.focus(editor)
    },
    [editor, path]
  )

  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        type={type}
        value={value}
        readOnly={readOnly}
        onClickingDelete={handleDelete}
        onClickingEdit={handleEdit}
      />
    )
  }, [type, value, readOnly, handleDelete, handleEdit])

  const tone = useMemo(() => {
    if (selected || focused) {
      return 'primary'
    }

    return 'default'
  }, [focused, selected])

  const padding = useMemo(() => {
    if (type?.type?.name === 'image') {
      return 0
    }

    return 1
  }, [type])

  // These are marker that is only for the block level (things further up, like annotations and inline objects are dealt with in their respective components)
  const blockMarkers = useMemo(
    () =>
      markers.filter(
        (marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === value._key
      ),
    [value._key, markers]
  )

  const errorMarkers = useMemo(
    () => blockMarkers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [blockMarkers]
  )
  const hasMarkers = blockMarkers.length > 0
  const hasErrors = errorMarkers.length > 0
  const markersToolTip =
    hasErrors || (hasMarkers && renderCustomMarkers) ? (
      <Tooltip
        placement="top"
        portal
        content={
          <Stack space={3} padding={2} style={{maxWidth: 250}}>
            <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
          </Stack>
        }
      >
        <div>{blockPreview}</div>
      </Tooltip>
    ) : undefined

  return (
    <Root
      data-focused={focused || undefined}
      data-invalid={hasErrors || undefined}
      data-selected={selected || undefined}
      data-markers={hasMarkers || undefined}
      data-testid="pte-block-object"
      marginY={3}
      onDoubleClick={handleClickToOpen}
      padding={padding}
      ref={elementRef}
      tone={tone}
    >
      <div ref={blockRef}>{markersToolTip || blockPreview}</div>
    </Root>
  )
}
