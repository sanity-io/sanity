import React, {useMemo} from 'react'
import {Box, Flex, rem, ResponsivePaddingProps, Stack, Theme, Tooltip} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {hues} from '@sanity/color'
import {isKeySegment, Marker} from '@sanity/types'
import {PortableTextBlock, RenderAttributes} from '@sanity/portable-text-editor'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/change-indicators'
import {RenderBlockActions, RenderCustomMarkers} from '../../types'
import Markers from '../../legacyParts/Markers'
import PatchEvent from '../../../../PatchEvent'
import {BlockActions} from '../../BlockActions'
import {
  BlockQuote,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Normal,
} from './textStyles'

export interface TextBlockProps {
  attributes: RenderAttributes
  block: PortableTextBlock
  blockRef?: React.RefObject<HTMLDivElement>
  children: React.ReactNode
  isFullscreen?: boolean
  markers: Marker[]
  onChange: (event: PatchEvent) => void
  readOnly: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  value: PortableTextBlock[] | undefined
}
interface TextBlockStyleProps {
  $level?: number
  $listItem?: 'bullet' | 'number'
  $size: number
  $style: 'heading' | 'text'
}

export const TEXT_STYLES = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,
  normal: Normal,
  blockquote: BlockQuote,
}

const HEADER_SIZES: {[key: string]: number | undefined} = {
  h1: 4,
  h2: 3,
  h3: 2,
  h4: 1,
  h5: 0,
  h6: 0,
}

const TEXT_STYLES_KEYS = Object.keys(TEXT_STYLES)
const HEADER_SIZES_KEYS = Object.keys(HEADER_SIZES)

const BULLET_MARKERS = ['●', '○', '■']
const NUMBER_FORMATS = ['number', 'lower-alpha', 'lower-roman']

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const noUserSelectStyle: React.CSSProperties = {userSelect: 'none'}

/**
 * This CSS needs to be added to the parent component in order to keep track of the list count
 */
export const listCounterCSS = css`
  counter-reset: ${LEVELS.map((lvl) => createListName(lvl)).join(' ')};
`

function createListName(level: number) {
  return `pt-list${level}`
}

function getBulletMarker(level: number, listItem: 'bullet' | 'number') {
  if (listItem === 'bullet' && typeof level === 'number') {
    return `'${BULLET_MARKERS[(level - 1) % BULLET_MARKERS.length]}'`
  }

  if (listItem === 'number' && typeof level === 'number') {
    return `counter(${createListName(level)}, ${
      NUMBER_FORMATS[(level - 1) % NUMBER_FORMATS.length]
    })`
  }

  return undefined
}

function textBlockStyle(props: TextBlockStyleProps & {theme: Theme}) {
  const {$level, $listItem, $size, $style, theme} = props
  const {space, fonts, color} = theme.sanity
  const font = fonts[$style]
  const _size = $style === 'heading' ? $size + 1 : $size

  const {fontSize, lineHeight, ascenderHeight} = font.sizes[_size || 0]
  const indent = typeof $level === 'number' ? space[4] * $level : undefined
  const bulletMarker = getBulletMarker($level, $listItem)
  const counter = createListName($level)

  const overlay = css`
    content: '';
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border-radius: ${theme.sanity.radius[2]}px;
  `

  return css`
    --text-bullet-marker: ${$listItem === 'number' ? `${bulletMarker} '.'` : bulletMarker};
    --text-block-indent: ${indent ? rem(space[3] + space[3] + indent) : undefined};
    --text-font-family: ${fonts.text.family};

    mix-blend-mode: ${color.dark ? 'screen' : 'multiply'};
    position: relative;

    & > [data-ui='TextBlock_inner'] {
      position: relative;
      padding-left: var(--text-block-indent);
      flex: 1;
    }

    &[data-markers] > div:before {
      ${overlay}
      background-color: ${color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-invalid] {
      --card-border-color: ${color.muted.critical.enabled.border};
      & > div:before {
        ${overlay}
        background-color: ${color.muted.critical.hovered.bg};
      }
    }

    & > div > [data-ui='TextBlock__text'] {
      align-items: center;
      display: flex;
      overflow-wrap: anywhere;
      position: relative;
      text-transform: none;
      white-space: pre-wrap;
      font-family: var(--text-font-family);

      ${$listItem &&
      css`
        /* Set the count to 0 on new levels */
        counter-set: ${$listItem === 'number' ? `${createListName($level + 1)} 0` : undefined};
        /* If the list item is not number, set the counter 0 */
        counter-reset: ${$listItem === 'number' ? undefined : `${counter} 0`};
        /* Increment counter */
        counter-increment: ${counter};

        &:before {
          content: var(--text-bullet-marker);
          font-family: var(--text-font-family);
          color: var(--card-muted-fg-color);
          position: absolute;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          left: -1rem;
          transform: translateX(-100%);
          height: ${lineHeight}px;
          line-height: 1;
          font-size: ${$listItem === 'bullet' ? fontSize / 2 : fontSize}px;
          padding-top: ${$listItem === 'bullet' ? '.1em' : undefined};
          top: ${0 - ascenderHeight}px;
        }
      `}
    }
  `
}

const TextRoot = styled(Flex)<TextBlockStyleProps>(textBlockStyle)

const InnerFlex = styled(Flex)`
  position: relative;
`

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
    `
  }
)

const BlockActionsOuter = styled(Box)`
  width: 25px;
  position: relative;
`

const BlockActionsInner = styled(Flex)`
  position: absolute;
  right: 0;
  top: -7px;
`

export function TextBlock(props: TextBlockProps): React.ReactElement {
  const {
    attributes,
    block,
    blockRef,
    children,
    isFullscreen,
    markers,
    onChange,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    value,
  } = props
  const {focused} = attributes

  // These are marker that is only for the block level (things further up, like annotations and inline objects are dealt with in their respective components)
  const blockMarkers = useMemo(
    () =>
      markers.filter(
        (marker) =>
          marker.path.length === 1 &&
          isKeySegment(marker.path[0]) &&
          marker.path[0]._key === block._key
      ),
    [block._key, markers]
  )

  const errorMarkers = useMemo(
    () => blockMarkers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [blockMarkers]
  )
  const hasMarkers = blockMarkers.length > 0
  const hasErrors = errorMarkers.length > 0

  const {$size, $style} = useMemo((): {$size: number; $style: 'text' | 'heading'} => {
    if (HEADER_SIZES_KEYS.includes(block.style)) {
      return {$style: 'heading', $size: HEADER_SIZES[block.style]}
    }

    return {$size: 2, $style: 'text'}
  }, [block])

  const text = useMemo(() => {
    const hasTextStyle = TEXT_STYLES_KEYS.includes(block.style)

    if (hasTextStyle) {
      const TextComponent = TEXT_STYLES[block.style]

      return (
        <div data-ui="TextBlock__text">
          <TextComponent>{children}</TextComponent>
        </div>
      )
    }

    return <div data-ui="TextBlock__text">{children}</div>
  }, [block.style, children])

  const outerPaddingProps: ResponsivePaddingProps = useMemo(() => {
    if (block.listItem) {
      return {paddingY: 2}
    }

    switch (block.style) {
      case 'h1': {
        return {paddingTop: 5, paddingBottom: 4}
      }
      case 'h2': {
        return {paddingTop: 4, paddingBottom: 4}
      }
      case 'h3': {
        return {paddingTop: 4, paddingBottom: 3}
      }
      case 'h4': {
        return {paddingTop: 4, paddingBottom: 3}
      }
      case 'h5': {
        return {paddingTop: 4, paddingBottom: 3}
      }
      case 'h6': {
        return {paddingTop: 4, paddingBottom: 2}
      }
      case 'normal': {
        return {paddingTop: 2, paddingBottom: 3}
      }
      case 'blockquote': {
        return {paddingTop: 2, paddingBottom: 3}
      }
      default: {
        return {paddingY: 2}
      }
    }
  }, [block])

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

  const markersToolTip = useMemo(
    () =>
      hasErrors || (hasMarkers && renderCustomMarkers) ? (
        <Tooltip
          placement="top"
          boundaryElement={blockRef?.current}
          portal
          content={
            <Stack space={3} padding={2} style={{maxWidth: 250}}>
              <Markers markers={blockMarkers} renderCustomMarkers={renderCustomMarkers} />
            </Stack>
          }
        >
          {text}
        </Tooltip>
      ) : undefined,
    [blockMarkers, blockRef, hasErrors, hasMarkers, renderCustomMarkers, text]
  )

  return (
    <Box {...outerPaddingProps}>
      <InnerFlex>
        <Box flex={1} {...innerPaddingProps}>
          <TextRoot
            $level={block.level}
            $listItem={block.listItem}
            $size={$size}
            $style={$style}
            data-invalid={hasErrors || undefined}
            data-level={block.level}
            data-list-item={block.listItem}
            data-markers={hasMarkers || undefined}
            data-style={$style}
            data-ui="TextBlock"
            ref={blockRef}
            flex={1}
          >
            <Box data-ui="TextBlock_inner">{markersToolTip || text}</Box>
          </TextRoot>
        </Box>
        <div style={noUserSelectStyle} contentEditable={false}>
          {renderBlockActions && (
            <BlockActionsOuter marginRight={1}>
              <BlockActionsInner>
                {value && focused && !readOnly && (
                  <BlockActions
                    onChange={onChange}
                    block={block}
                    value={value}
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
        </div>
      </InnerFlex>
    </Box>
  )
}
