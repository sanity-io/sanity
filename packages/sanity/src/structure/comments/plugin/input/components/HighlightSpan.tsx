import {hues} from '@sanity/color'
import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const HighlightSpan = styled.span(({theme}: {theme: Theme}) => {
  const isDark = theme.sanity.v2?.color._dark

  // With comments
  const bg = hues.yellow[isDark ? 700 : 100].hex
  const border = hues.yellow[isDark ? 800 : 300].hex
  const hoverBg = hues.yellow[isDark ? 800 : 200].hex
  const hoverBorder = hues.yellow[isDark ? 900 : 400].hex

  // When adding comment
  const lightBg = hues.yellow[isDark ? 600 : 50].hex
  const lightBorder = hues.yellow[isDark ? 700 : 100].hex

  return css`
    box-sizing: border-box;
    mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
    transition:
      background-color 100ms ease,
      border-color 100ms ease;

    &[data-inline-comment-state='authoring'] {
      background-color: ${lightBg};
      border-bottom: 2px solid ${lightBorder};
    }

    &[data-inline-comment-state='added'] {
      background-color: ${bg};
      border-bottom: 2px solid ${border};
    }

    @media (hover: hover) {
      &:hover {
        &[data-inline-comment-state='added'] {
          background-color: ${hoverBg};
          border-bottom: 2px solid ${hoverBorder};
        }

        [data-ui='CommentDecorator'] {
          background-color: inherit;
          border-bottom: inherit;
        }
      }
    }
  `
})
