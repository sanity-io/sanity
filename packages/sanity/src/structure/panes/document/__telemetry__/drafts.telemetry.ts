import {defineEvent} from '@sanity/telemetry'

/**
 * When a draft is successfully created
 * @internal
 */
export const CreatedDraft = defineEvent({
  name: 'Create a new draft',
  version: 1,
  description: 'User created a new draft',
})
