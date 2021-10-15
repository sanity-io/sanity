import React, {useMemo} from 'react'
import {Box, rem, ResponsivePaddingProps, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {hues} from '@sanity/color'
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
  blockRef?: React.RefObject<HTMLDivElement>
  children: React.ReactNode
  hasError?: boolean
  hasMarker?: boolean
  level?: number
  listItem?: 'bullet' | 'number'
  style?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'normal' | 'blockquote'
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

    & > div {
      position: relative;
      padding-left: var(--text-block-indent);
    }

    &[data-markers] > div:before {
      ${overlay}
      background-color: ${hues.purple[50].hex};
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

const Root = styled(Box)<TextBlockStyleProps>(textBlockStyle)

export function TextBlock(props: TextBlockProps): React.ReactElement {
  const {children, level, listItem, style, blockRef, hasError, hasMarker} = props

  const {$size, $style} = useMemo((): {$size: number; $style: 'text' | 'heading'} => {
    if (HEADER_SIZES_KEYS.includes(style)) {
      return {$style: 'heading', $size: HEADER_SIZES[style]}
    }

    return {$size: 2, $style: 'text'}
  }, [style])

  const text = useMemo(() => {
    const hasTextStyle = TEXT_STYLES_KEYS.includes(style)

    if (hasTextStyle) {
      const TextComponent = TEXT_STYLES[style]

      return (
        <div data-ui="TextBlock__text">
          <TextComponent>{children}</TextComponent>
        </div>
      )
    }

    return <div data-ui="TextBlock__text">{children}</div>
  }, [style, children])

  const paddingProps: ResponsivePaddingProps = useMemo(() => {
    if (listItem) {
      return {paddingY: 2}
    }

    switch (style) {
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
  }, [listItem, style])

  return (
    <Root
      $level={level}
      $listItem={listItem}
      $size={$size}
      $style={$style}
      data-level={level}
      data-list-item={listItem}
      data-style={$style}
      data-ui="TextBlock"
      data-invalid={hasError ? '' : undefined}
      data-markers={hasMarker ? '' : undefined}
      ref={blockRef}
      {...paddingProps}
    >
      <div>{text}</div>
    </Root>
  )
}
