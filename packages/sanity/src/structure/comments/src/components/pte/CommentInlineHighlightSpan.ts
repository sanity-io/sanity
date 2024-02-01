import {hues} from '@sanity/color'
import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

/**
 * The styling needs to be applied using data attributes as they are also used
 * in query selectors.
 *
 * The available selectors are:
 * - `[data-inline-comment-state='added']` - The comment has been added
 * - `[data-inline-comment-state='authoring']` - The comment is being authored
 * - `[data-inline-comment-nested='true']` - The comment is a nested comment
 * - `[data-hovered='true']` - The comment is hovered
 */
export const CommentInlineHighlightSpan = styled.span(({theme}: {theme: Theme}) => {
  const isDark = theme.sanity.v2?.color._dark

  // Colors used when a comment is added
  const addedBg = hues.yellow[isDark ? 800 : 100].hex
  const addedBorder = hues.yellow[isDark ? 700 : 300].hex

  const addedHoverBg = hues.yellow[isDark ? 700 : 200].hex
  const addedHoverBorder = hues.yellow[isDark ? 600 : 400].hex

  // Colors used when a comment is added and it is a nested comment
  const addedNestedBg = hues.yellow[isDark ? 700 : 200].hex
  const addedNesterBorder = hues.yellow[isDark ? 600 : 400].hex

  // Colors used when a comment is being authored
  const authoringBg = hues.yellow[isDark ? 900 : 50].hex
  const authoringBorder = hues.yellow[isDark ? 800 : 200].hex

  return css`
    box-sizing: border-box;
    transition:
      background-color 100ms ease,
      border-color 100ms ease;

    // Make sure that child elements appropriately blend with the
    // background of the highlight span
    * {
      mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
    }

    &[data-inline-comment-state='added'][data-inline-comment-nested='false'] {
      background-color: ${addedBg};
      border-bottom: 2px solid ${addedBorder};
    }

    &[data-inline-comment-state='added'][data-inline-comment-nested='true'] {
      background-color: ${addedNestedBg};
      border-bottom: 2px solid ${addedNesterBorder};
    }

    &[data-inline-comment-state='added'][data-inline-comment-nested='false'][data-hovered='true'] {
      background-color: ${addedHoverBg};
      border-bottom: 2px solid ${addedHoverBorder};
    }

    &[data-inline-comment-state='authoring'] {
      background-color: ${authoringBg};
      border-bottom: 2px solid ${authoringBorder};
    }

    @media (hover: hover) {
      &:hover {
        &[data-inline-comment-state='added'][data-inline-comment-nested='false'] {
          background-color: ${addedHoverBg};
          border-bottom: 2px solid ${addedHoverBorder};
        }

        [data-ui='CommentDecorator'] {
          background-color: inherit;
          border-bottom: inherit;
        }
      }
    }
  `
})
