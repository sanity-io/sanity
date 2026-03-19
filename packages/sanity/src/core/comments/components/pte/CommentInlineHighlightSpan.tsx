import {hues} from '@sanity/color'
// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {forwardRef} from 'react'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {
  addedBgVar,
  addedBorderVar,
  addedHoverBgVar,
  addedHoverBorderVar,
  addedNestedBgVar,
  addedNestedBorderVar,
  authoringBgVar,
  authoringBorderVar,
  blendModeVar,
  highlightSpan,
} from './CommentInlineHighlightSpan.css'

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
  const theme = useThemeV2()
  const isDark = theme.color._dark

  const state = isAdded ? 'added' : isAuthoring ? 'authoring' : undefined

  // Colors used when a comment is added
  const addedBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 800 : 100].hex
  const addedBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 300].hex

  const addedHoverBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 200].hex
  const addedHoverBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 600 : 400].hex

  // Colors used when a comment is added and it is a nested comment
  const addedNestedBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 700 : 200].hex
  const addedNestedBorder = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 600 : 400].hex

  // Colors used when a comment is being authored.
  // For now, we use the same colors as when a comment is added.
  const authoringBg = addedBg
  const authoringBorder = addedBorder

  return (
    <span
      {...rest}
      className={highlightSpan}
      style={assignInlineVars({
        [addedBgVar]: addedBg,
        [addedBorderVar]: addedBorder,
        [addedHoverBgVar]: addedHoverBg,
        [addedHoverBorderVar]: addedHoverBorder,
        [addedNestedBgVar]: addedNestedBg,
        [addedNestedBorderVar]: addedNestedBorder,
        [authoringBgVar]: authoringBg,
        [authoringBorderVar]: authoringBorder,
        [blendModeVar]: isDark ? 'screen' : 'multiply',
      })}
      data-hovered={isHovered ? 'true' : 'false'}
      data-inline-comment-nested={isNested ? 'true' : 'false'}
      data-inline-comment-state={state}
      ref={ref}
    >
      {children}
    </span>
  )
})
