import {createVar, style} from '@vanilla-extract/css'

/** `min(itemCount, INCOMING_REFERENCES_MAX_VISIBLE_ITEMS) * INCOMING_REFERENCES_ITEM_HEIGHT`, in px */
export const heightVar = createVar()

export const incomingReferencesListContainer = style({
  height: heightVar,
})
