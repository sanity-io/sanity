import {defineEvent} from '@sanity/telemetry'

export const DocumentGroupInventoryHintPressed = defineEvent({
  version: 1,
  name: 'Document Group Inventory Hint Pressed',
  description: 'User opened the document group inventory by pressing the onboarding hint.',
})
