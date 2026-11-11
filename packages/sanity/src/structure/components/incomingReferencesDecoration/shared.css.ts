import {css} from '#styled-system/css'

/**
 * `min(itemCount, INCOMING_REFERENCES_MAX_VISIBLE_ITEMS) * INCOMING_REFERENCES_ITEM_HEIGHT`, in px,
 * set inline by `IncomingReferencesListContainer` from its `$itemCount` prop
 */
export const heightVar = '--incoming-references-list-height'

export const incomingReferencesListContainer = css({
  // `&&` beats Box's own `height` (0,1,0); a single class loses to source order
  '&&': {
    height: `var(${heightVar})`,
  },
})
