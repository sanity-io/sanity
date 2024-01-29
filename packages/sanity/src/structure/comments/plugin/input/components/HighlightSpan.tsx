import {hues} from '@sanity/color'
import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const HighlightSpan = styled.span(({theme}: {theme: Theme}) => {
  const isDark = theme.sanity.v2?.color._dark

  // Colors used when a comment is added
  const bg = hues.yellow[isDark ? 700 : 100].hex
  const border = hues.yellow[isDark ? 800 : 300].hex
  const hoverBg = hues.yellow[isDark ? 800 : 200].hex
  const hoverBorder = hues.yellow[isDark ? 900 : 400].hex

  // Colors used when a comment is added and it is a nested comment
  const nestedBg = hues.yellow[isDark ? 800 : 200].hex
  const nestedBorder = hues.yellow[isDark ? 900 : 400].hex
  const nestedHoverBg = hues.yellow[isDark ? 900 : 300].hex
  const nestedHoverBorder = hues.yellow[isDark ? 950 : 400].hex

  // Colors used when a comment is being authored
  const lightBg = hues.yellow[isDark ? 600 : 50].hex
  const lightBorder = hues.yellow[isDark ? 700 : 100].hex

  return css`
    box-sizing: border-box;
    mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
    transition:
      background-color 100ms ease,
      border-color 100ms ease;

    * {
      mix-blend-mode: multiply;
    }

    &[data-inline-comment-state='added'][data-nested-inline-comment='false'] {
      background-color: ${bg};
      border-bottom: 2px solid ${border};
    }

    &[data-inline-comment-state='added'][data-nested-inline-comment='true'] {
      background-color: ${nestedBg};
      border-bottom: 2px solid ${nestedBorder};
    }

    &[data-inline-comment-state='added'][data-nested-inline-comment='false'][data-hovered='true'] {
      background-color: ${hoverBg};
      border-bottom: 2px solid ${hoverBorder};
    }

    &[data-inline-comment-state='added'][data-nested-inline-comment='true'][data-hovered='true'] {
      background-color: ${nestedHoverBg};
      border-bottom: 2px solid ${nestedHoverBorder};
    }

    &[data-inline-comment-state='authoring'] {
      background-color: ${lightBg};
      border-bottom: 2px solid ${lightBorder};
    }

    @media (hover: hover) {
      &:hover {
        &[data-inline-comment-state='added'][data-nested-inline-comment='false'] {
          background-color: ${hoverBg};
          border-bottom: 2px solid ${hoverBorder};
        }

        &[data-inline-comment-state='added'][data-nested-inline-comment='true'] {
          background-color: ${nestedHoverBg};
          border-bottom: 2px solid ${nestedHoverBorder};
        }

        [data-ui='CommentDecorator'] {
          background-color: inherit;
          border-bottom: inherit;
        }
      }
    }
  `
})
