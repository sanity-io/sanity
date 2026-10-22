import {css} from '#styled-system/css'

/**
 * Container styles for string diff decorations; compose them into the editor root with
 * `css(stringDiffContainerStylesRaw, {...})`. The descendant rules select the `del`/`ins`
 * segments rendered by `./segments`, which carry `data-string-diff-segment`.
 */
export const stringDiffContainerStylesRaw = css.raw({
  '& del[data-string-diff-segment]': {
    'opacity': 0.5,
    'textDecoration': 'line-through',
    '&::before': {
      textDecoration: 'line-through',
      content: 'attr(data-text)',
    },
  },
  '& ins[data-string-diff-segment]': {
    textDecoration: 'none',
  },
})

export const stringDiffContainerStyles = css(stringDiffContainerStylesRaw)
