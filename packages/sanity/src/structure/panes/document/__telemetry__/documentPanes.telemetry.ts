import {defineEvent} from '@sanity/telemetry'

/**
 * @internal
 */
export const DocumentURLCopied = defineEvent({
  name: 'Document URL Copied',
  version: 1,
  description: 'User copied document URL to clipboard',
})

/**
 * @internal
 */
export const DocumentIDCopied = defineEvent({
  name: 'Document ID Copied',
  version: 1,
  description: 'User copied document ID to clipboard',
})

/**
 * @internal
 */
export const InlineChangesSwitchedOn = defineEvent({
  name: 'Inline Changes Switched On',
  version: 1,
  description: 'User switched on display of inline changes',
})

/**
 * @internal
 */
export const InlineChangesSwitchedOff = defineEvent({
  name: 'Inline Changes Switched Off',
  version: 1,
  description: 'User switched off display of inline changes',
})
