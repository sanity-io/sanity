import {defineEvent} from '@sanity/telemetry'

export const CommentsUpsellPanelPrimaryBtnClicked = defineEvent({
  name: 'Comments upsell primary button clicked',
  version: 1,
  description: 'User clicked the "Primary" button in the upsell panel',
})

export const CommentsUpsellPanelSecondaryBtnClicked = defineEvent({
  name: 'Comments upsell secondary button clicked',
  version: 1,
  description: 'User clicked the "Secondary" button in the upsell panel',
})

export const CommentsUpsellDialogPrimaryBtnClicked = defineEvent({
  name: 'Comments upsell primary button clicked',
  version: 1,
  description: 'User clicked the "Primary" button in the upsell dialog',
})

export const CommentsUpsellDialogSecondaryBtnClicked = defineEvent({
  name: 'Comments upsell secondary button clicked',
  version: 1,
  description: 'User clicked the "Secondary" button in the upsell dialog',
})
