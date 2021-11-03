import {
  PortableTextEditor,
  PortableTextBlock,
  Type,
  RenderAttributes,
} from '@sanity/portable-text-editor'
import {isKeySegment, Marker, Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Card, Theme, Tooltip, Stack, Flex, Box, ResponsivePaddingProps} from '@sanity/ui'
import {hues} from '@sanity/color'
import React, {useCallback, useMemo, useRef} from 'react'
import styled, {css} from 'styled-components'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/change-indicators'
import {RenderBlockActions, RenderCustomMarkers} from '../types'
import Markers from '../legacyParts/Markers'
import PatchEvent from '../../../PatchEvent'
import {BlockActions} from '../BlockActions'
import {BlockObjectPreview} from './BlockObjectPreview'

interface BlockObjectProps {
  attributes: RenderAttributes
  block: PortableTextBlock
  blockRef?: React.RefObject<HTMLDivElement>
  editor: PortableTextEditor
  markers: Marker[]
  isFullscreen?: boolean
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  readOnly: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  type: Type
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

const StyledChangeIndicatorWithProvidedFullPath = styled(ChangeIndicatorWithProvidedFullPath)(
  ({theme}: {theme: Theme}) => {
    const {space} = theme.sanity

    return css`
      width: 1px;
      position: absolute;
      right: -1px;
      top: -${space[1]}px;
      bottom: -${space[1]}px;

      & > div {
        height: 100%;
      }

      [data-dragged] & {
        visibility: hidden;
      }
    `
  }
)

const InnerFlex = styled(Flex)`
  position: relative;

  [data-dragged] > & {
    opacity: 0.5;
  }
`

const BlockActionsOuter = styled(Box)`
  width: 25px;
  position: relative;

  [data-dragged] & {
    visibility: hidden;
  }
`

const BlockActionsInner = styled(Flex)`
  position: absolute;
  right: 0;
`

const TooltipStack = styled(Stack)`
  max-width: 250px;
`
const BlockPreview = styled(Box)((props: {theme: Theme}) => {
  const color = props.theme.sanity.color.input
  return css`
    background-color: ${color.default.enabled.bg};
  `
})

export function BlockObject(props: BlockObjectProps) {
  const {
    attributes: {focused, selected, path},
    block,
    blockRef,
    editor,
    isFullscreen,
    markers,
    onChange,
    onFocus,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    type,
  } = props
  const elementRef = useRef<HTMLDivElement>()

  const handleEdit = useCallback(() => {
    onFocus(path.concat(FOCUS_TERMINATOR))
  }, [onFocus, path])

  const handleClickToOpen = useCallback(() => {
    handleEdit()
  }, [handleEdit])

  const handleDelete = useCallback(() => {
    PortableTextEditor.delete(
      editor,
      {focus: {path, offset: 0}, anchor: {path, offset: 0}},
      {mode: 'block'}
    )
    PortableTextEditor.focus(editor)
  }, [editor, path])

  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        type={type}
        value={block}
        readOnly={readOnly}
        onClickingDelete={handleDelete}
        onClickingEdit={handleEdit}
      />
    )
  }, [type, block, readOnly, handleDelete, handleEdit])

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

  const innerPaddingProps: ResponsivePaddingProps = useMemo(() => {
    if (isFullscreen && !renderBlockActions) {
      return {paddingX: 5}
    }

    if (isFullscreen && renderBlockActions) {
      return {paddingLeft: 5, paddingRight: 2}
    }

    if (renderBlockActions) {
      return {
        paddingLeft: 3,
        paddingRight: 2,
      }
    }

    return {paddingX: 3}
  }, [isFullscreen, renderBlockActions])

  // These are marker that is only for the block level (things further up, like annotations and inline objects are dealt with in their respective components)
  const blockMarkers = useMemo(
    () =>
      markers.filter(
        (marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key
      ),
    [block._key, markers]
  )

  const errorMarkers = useMemo(
    () => blockMarkers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [blockMarkers]
  )
  const hasMarkers = blockMarkers.length > 0
  const hasErrors = errorMarkers.length > 0
  const markersToolTip = useMemo(
    () =>
      hasErrors || (hasMarkers && renderCustomMarkers) ? (
        <Tooltip
          placement="top"
          portal="editor"
          content={
            <TooltipStack space={3} padding={2}>
              <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
            </TooltipStack>
          }
        >
          <div>{blockPreview}</div>
        </Tooltip>
      ) : undefined,
    [blockPreview, hasErrors, hasMarkers, markers, renderCustomMarkers]
  )

  return (
    <InnerFlex marginY={3}>
      <Flex flex={1} {...innerPaddingProps}>
        <Root
          data-focused={focused || undefined}
          data-invalid={hasErrors || undefined}
          data-selected={selected || undefined}
          data-markers={hasMarkers || undefined}
          data-testid="pte-block-object"
          // data-pt-drag-ghost-element
          onDoubleClick={handleClickToOpen}
          ref={elementRef}
          tone={tone}
          padding={padding}
          flex={1}
        >
          <BlockPreview ref={blockRef}>{markersToolTip || blockPreview}</BlockPreview>
        </Root>
      </Flex>
      {renderBlockActions && (
        <BlockActionsOuter marginRight={1}>
          <BlockActionsInner>
            {block && focused && !readOnly && (
              <BlockActions
                onChange={onChange}
                block={block}
                renderBlockActions={renderBlockActions}
              />
            )}
          </BlockActionsInner>
        </BlockActionsOuter>
      )}
      {isFullscreen && (
        <StyledChangeIndicatorWithProvidedFullPath
          compareDeep
          value={block}
          hasFocus={focused}
          path={[{_key: block._key}]}
        />
      )}
    </InnerFlex>
  )
}
