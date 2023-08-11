import styled, {css} from 'styled-components'
import {Box, Button, Theme} from '@sanity/ui'
import {BreadcrumbItemProps} from './BreadcrumbItem'

export const BREADCRUMB_ITEM_TITLE_MIN_WIDTH = 220
export const BREADCRUMB_ITEM_MAX_WIDTH = 130

export const Root = styled.ol`
  margin: 0;
  padding: 0;
  display: flex;
  list-style: none;
  align-items: center;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
`

export const ExpandButton = styled(Button)`
  appearance: none;
  width: 23px;
  height: 27px;

  [data-ui='Text'] {
    font-weight: 500;
  }
`

export const BreadcrumbItemRoot = styled(Box)`
  max-width: ${BREADCRUMB_ITEM_MAX_WIDTH}px;

  :last-child {
    min-width: ${BREADCRUMB_ITEM_TITLE_MIN_WIDTH}px;
    max-width: inherit;
  }
`
export const BreadcrumbButtonRoot = styled(Button)<BreadcrumbItemProps>`
  ${({isTitle}) => (isTitle ? `max-width: 100%;` : `max-width: ${BREADCRUMB_ITEM_MAX_WIDTH}px`)};
`

export const BreadcrumbItemSpan = styled.span(({theme}: {theme: Theme}) => {
  const {fg} = theme.sanity.color.card.enabled
  const {lineHeight, fontSize} = theme.sanity.fonts.text.sizes[1]

  return css`
    display: block;
    line-height: calc(${lineHeight} / ${fontSize});
    text-overflow: ellipsis;
    overflow: clip;
    white-space: nowrap;
    color: ${fg};
    font-weight: 500;
  `
})

export const TooltipRoot = styled(Box)`
  max-width: 500px;
`
