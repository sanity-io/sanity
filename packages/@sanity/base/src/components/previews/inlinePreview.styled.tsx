import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const RootSpan = styled.span`
  display: inline-flex;
  align-items: center;
  vertical-align: top;
  max-width: 100%;
  height: 15px;
`

export const MediaDiv = styled.div`
  position: relative;
  display: inline-block;
  width: calc(1em - 1px);
  height: calc(1em - 1px);
  min-width: calc(1em - 1px);

  & img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${({theme}) => theme.sanity.radius[1]}px;
    margin-right: ${({theme}) => theme.sanity.space[1]}px;
  }

  & img + span {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 0 1px var(--card-fg-color);
    opacity: 0.2;
    border-radius: ${({theme}) => theme.sanity.radius[1]}px;
  }

  & svg {
    display: block;
    font-size: calc(14 / 16 * 1em);
    margin: 1px 0;

    &[data-sanity-icon] {
      font-size: calc(18 / 16 * 1em);
      margin: calc(1px + (2 / 18 * -1em)) 0;
    }
  }
`

export const TextSpan = styled.span(({theme}: {theme: Theme}) => {
  const textFont = theme.sanity.fonts.text
  const textSize = textFont.sizes[1]

  return css`
    font-size: calc(${textSize.fontSize} / 16 * 1em);
    font-weight: ${textFont.weights.medium};
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    height: 9px;
    line-height: ${textSize.lineHeight / textSize.fontSize};
    padding-left: 0.25em;
    padding-right: 0.25em;
    min-width: 0;

    span {
      display: block;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  `
})
