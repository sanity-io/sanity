import {hues} from '@sanity/color'
import {type Theme} from '@sanity/ui'
import {forwardRef} from 'react'
import {css, styled} from 'styled-components'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'

export const HighlightSpan = styled.span(({theme}: {theme: Theme}) => {
  const isDark = theme.sanity.v2?.color._dark

  // Colors used when a comment is added
  const addedBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 800 : 100].hex
  const addedBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 300].hex

  const addedHoverBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 200].hex
  const addedHoverBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 600 : 400].hex

  // Colors used when a comment is added and it is a nested comment
  const addedNestedBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 200].hex
  const addedNesterBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 600 : 400].hex

  // Colors used when a comment is being authored.
  // For now, we use the same colors as when a comment is added.
  const authoringBg = addedBg
  const authoringBorder = addedBorder

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
  `
})

interface CommentInlineHighlightSpanProps {
  children: React.ReactNode
  isAdded?: boolean
  isAuthoring?: boolean
  isHovered?: boolean
  isNested?: boolean
}

/**
 * @internal
 */
export const CommentInlineHighlightSpan = forwardRef(function CommentInlineHighlightSpan(
  props: CommentInlineHighlightSpanProps & React.HTMLProps<HTMLSpanElement>,
  ref: React.Ref<HTMLSpanElement>,
) {
  const {children, isAdded, isAuthoring, isHovered, isNested, ...rest} = props

  // eslint-disable-next-line no-nested-ternary
  const state = isAdded ? 'added' : isAuthoring ? 'authoring' : undefined

  return (
    <HighlightSpan
      {...rest}
      data-hovered={isHovered ? 'true' : 'false'}
      data-inline-comment-nested={isNested ? 'true' : 'false'}
      data-inline-comment-state={state}
      ref={ref}
    >
      {children}
    </HighlightSpan>
  )
})
