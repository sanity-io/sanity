import {css} from '#styled-system/css'

/** `min(itemCount, INCOMING_REFERENCES_MAX_VISIBLE_ITEMS) * INCOMING_REFERENCES_ITEM_HEIGHT`, in px */
export const heightVar = '--shared-height'

export const incomingReferencesListContainer = css({
  height: `var(${heightVar})`,
})
