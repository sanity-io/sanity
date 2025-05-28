import {defineEvent} from '@sanity/telemetry'

/**
 * @internal
 */
export const DocumentURLCopied = defineEvent({
  name: 'DocumentURLCopied',
  version: 1,
  description: 'User copied document URL to clipboard',
})
