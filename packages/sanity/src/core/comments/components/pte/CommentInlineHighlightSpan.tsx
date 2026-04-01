import {hues} from '@sanity/color'
import {type Theme} from '@sanity/ui'
import {forwardRef} from 'react'
import {css, styled, useTheme} from 'styled-components'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'

export const HighlightSpan = styled.span(({theme}: {theme: Theme}) => {
  const isDark = theme.sanity.v2?.color._dark

  // Semi-transparent backgrounds so overlapping comments visually stack
  const addedBg = `${hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 800 : 100].hex}66`
  const addedBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 300].hex

  const addedHoverBg = `${hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 200].hex}8C`
  const addedHoverBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 600 : 400].hex

  const addedNestedBg = `${hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 200].hex}66`
  const addedNestedBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 600 : 400].hex

  const authoringBg = addedBg
  const authoringBorder = addedBorder

  return css`
    box-sizing: border-box;
    transition:
      background-color 100ms ease,
      border-color 100ms ease;

    & * {
      mix-blend-mode: multiply;
    }

    &[data-dark='true'] * {
      mix-blend-mode: screen;
    }

    &[data-inline-comment-state='added'][data-inline-comment-nested='false'] {
      background-color: ${addedBg};
      border-bottom: 2px solid ${addedBorder};
    }

    &[data-inline-comment-state='added'][data-inline-comment-nested='true'] {
      background-color: ${addedNestedBg};
      border-bottom: 2px solid ${addedNestedBorder};
    }

    &[data-inline-comment-state='added'][data-inline-comment-nested='false'][data-hovered='true'],
    &[data-inline-comment-state='added'][data-inline-comment-nested='false']:hover:not([data-hovered='true']) {
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

  const state = isAdded ? 'added' : isAuthoring ? 'authoring' : undefined
  const theme = useTheme() as Theme
  const isDark = theme.sanity.v2?.color._dark

  return (
    <HighlightSpan
      {...rest}
      data-dark={isDark ? 'true' : 'false'}
      data-hovered={isHovered ? 'true' : 'false'}
      data-inline-comment-nested={isNested ? 'true' : 'false'}
      data-inline-comment-state={state}
      ref={ref}
    >
      {children}
    </HighlightSpan>
  )
})
