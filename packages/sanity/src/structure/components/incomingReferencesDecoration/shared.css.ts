import {css} from '#styled-system/css'

/**
 * `min(itemCount, INCOMING_REFERENCES_MAX_VISIBLE_ITEMS) * INCOMING_REFERENCES_ITEM_HEIGHT`, in px,
 * set inline by `IncomingReferencesListContainer` from its `$itemCount` prop
 */
export const heightVar = '--incoming-references-list-height'

export const incomingReferencesListContainer = css({
  height: `var(${heightVar})`,
})
