import {globalStyle, style} from '@vanilla-extract/css'

import {segment} from './segments.css'

/**
 * Container class for string diff decorations; compose it into the editor root with
 * `style([stringDiffContainerStyles, {...}])`. The descendant rules below select the
 * `del`/`ins` segments rendered by `./segments`.
 */
export const stringDiffContainerStyles = style({})

globalStyle(`${stringDiffContainerStyles} del${segment}`, {
  opacity: 0.5,
  textDecoration: 'line-through',
})

globalStyle(`${stringDiffContainerStyles} del${segment}::before`, {
  textDecoration: 'line-through',
  content: 'attr(data-text)',
})

globalStyle(`${stringDiffContainerStyles} ins${segment}`, {
  textDecoration: 'none',
})
