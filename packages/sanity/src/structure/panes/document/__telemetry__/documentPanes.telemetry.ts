import {defineEvent} from '@sanity/telemetry'

/**
 * @internal
 */
export const DocumentURLCopied = defineEvent({
  name: 'DocumentURLCopied',
  version: 1,
  description: 'User copied document URL to clipboard',
})

/**
 * When a draft is successfully created
 * @internal
 */
export const CreatedDraft = defineEvent({
  name: 'Create a new draft',
  version: 1,
  description: 'User created a new draft',
})
