import {vars} from '@sanity/ui/css'
import {forwardRef} from 'react'
import {styled} from 'styled-components'

export const HighlightSpan = styled.span`
  box-sizing: border-box;
  transition:
    background-color 100ms ease,
    border-color 100ms ease;

  &[data-inline-comment-state='added'][data-inline-comment-nested='false'] {
    background-color: ${vars.color.tinted.caution.bg[2]};
    border-bottom: 1px solid ${vars.color.tinted.caution.fg[3]};
  }

  &[data-inline-comment-state='added'][data-inline-comment-nested='true'] {
    background-color: ${vars.color.tinted.caution.bg[3]};
    border-bottom: 1px solid ${vars.color.tinted.caution.fg[4]};
  }

  &[data-inline-comment-state='added'][data-inline-comment-nested='false'][data-hovered='true'] {
    background-color: ${vars.color.tinted.caution.bg[3]};
    border-bottom: 1px solid ${vars.color.tinted.caution.fg[4]};
  }

  &[data-inline-comment-state='authoring'] {
    background-color: ${vars.color.tinted.caution.bg[2]};
    border-bottom: 1px solid ${vars.color.tinted.caution.fg[3]};
  }
`

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
