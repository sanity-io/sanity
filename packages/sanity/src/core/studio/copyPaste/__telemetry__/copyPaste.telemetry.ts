import {defineEvent} from '@sanity/telemetry'

import {type BaseOptions} from '../types'

/**
 * The context the action was triggered from. Emitted verbatim, so the camelCase
 * spelling is fixed by both the public options type and the existing time series.
 */
export type CopyPasteContext = BaseOptions['context']['source']

interface FieldCopiedInfo {
  context: CopyPasteContext
  /**
   * The schema type(s) that was copied
   */
  schemaTypes: string[]
}

interface FieldPastedInfo {
  context: CopyPasteContext
  /**
   * The schema(s) type that was copied
   */
  schemaTypes: string[]
}

export const FieldCopied = defineEvent<FieldCopiedInfo>({
  name: 'Field Copied',
  version: 1,
  description:
    'User clicked the "Copy field" button in the field action menu or used the Ctrl+C shortcut',
})

export const FieldPasted = defineEvent<FieldPastedInfo>({
  name: 'Field Pasted',
  version: 1,
  description:
    'User clicked the "Paste field" button in the field action menu or used the Ctrl+V shortcut',
})
