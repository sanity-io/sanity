import {defineEvent} from '@sanity/telemetry'

interface FieldCopiedInfo {
  /**
   * The context the action was triggered from
   */
  context: 'fieldAction' | 'documentFieldAction' | 'keyboardShortcut' | 'arrayItem' | 'unknown'
  /**
   * The schema type(s) that was copied
   */
  schemaTypes: string[]
}

interface FieldPastedInfo {
  /**
   * The context the action was triggered from
   */
  context: 'fieldAction' | 'documentFieldAction' | 'keyboardShortcut' | 'arrayItem' | 'unknown'
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
