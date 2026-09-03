import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type RefAttributes} from 'react'

import {highlightSpan} from './CommentInlineHighlightSpan.css'

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
export function CommentInlineHighlightSpan(
  props: CommentInlineHighlightSpanProps &
    React.HTMLProps<HTMLSpanElement> &
    RefAttributes<HTMLSpanElement>,
) {
  const {ref, children, className, isAdded, isAuthoring, isHovered, isNested, ...rest} = props
  const {color} = useThemeV2()

  const state = isAdded ? 'added' : isAuthoring ? 'authoring' : undefined

  return (
    <span
      {...rest}
      className={clsx(color._dark ? highlightSpan.dark : highlightSpan.light, className)}
      data-hovered={isHovered ? 'true' : 'false'}
      data-inline-comment-nested={isNested ? 'true' : 'false'}
      data-inline-comment-state={state}
      ref={ref}
    >
      {children}
    </span>
  )
}
