import {Box, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled(Box)`
  position: relative;
`

export const Title = styled.h6(({theme}: {theme: Theme}) => {
  const {fontSize, lineHeight} = theme.sanity.fonts.heading.sizes[5]

  return css`
    font-size: ${fontSize}px;
    margin: 0;
    line-height: ${lineHeight}px;
    ${({
      $titleHeight,
      $isEditingForm,
      $muted,
    }: {
      $titleHeight?: number
      $isEditingForm?: boolean
      $muted: boolean
    }) => {
      return css`
        ${$titleHeight ? `height: ${$titleHeight}px` : ''};
        ${$isEditingForm
          ? css`
              overflow: hidden;
              text-overflow: ellipsis;
            `
          : ''}
        ${$muted ? `color: ${theme.sanity.color.card.disabled.fg};` : ''}
      `
    }}
  `
})

/**
 * This component is a hidden component that is laid on top of the title to calculate the height of the title
 */
export const HiddenTitle = styled.h6(({theme}: {theme: Theme}) => {
  const {fontSize, lineHeight} = theme.sanity.fonts.heading.sizes[5]
  return css`
    font-size: ${fontSize}px;
    margin: 0;
    line-height: ${lineHeight}px;
    position: absolute;
    top: 0;
    width: 100%;
    visibility: hidden;
    display: block;

    ${({$isEditingForm}: {$isEditingForm?: boolean}) => {
      return css`
        ${$isEditingForm
          ? css`
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `
          : ''}
      `
    }}
  `
})
