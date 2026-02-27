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
 * @internal
 */
export const DocumentIDCopied = defineEvent({
  name: 'DocumentIDCopied',
  version: 1,
  description: 'User copied document ID to clipboard',
})

/**
 * @internal
 */
export const InlineChangesSwitchedOn = defineEvent({
  name: 'InlineChangesSwitchedOn',
  version: 1,
  description: 'User switched on display of inline changes',
})

/**
 * @internal
 */
export const InlineChangesSwitchedOff = defineEvent({
  name: 'InlineChangesSwitchedOff',
  version: 1,
  description: 'User switched off display of inline changes',
})
