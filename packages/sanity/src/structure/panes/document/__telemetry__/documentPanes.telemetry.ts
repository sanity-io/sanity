import {defineEvent} from '@sanity/telemetry'

import {type ChangesInspectorTab} from '../constants'

/**
 * Values belong to the shared `path` vocabulary documented in `docs/TELEMETRY.md`.
 *
 * @internal
 */
export type DocumentHistoryOpenPath = 'status_line' | 'change_indicator' | 'pane_menu' | 'url'

interface DocumentHistoryInspectorOpenedInfo {
  /** Tab shown on open */
  tab: ChangesInspectorTab
  /** What triggered the open; `url` means a deep link rather than an in-studio interaction */
  path: DocumentHistoryOpenPath
}

/**
 * @internal
 */
export const DocumentHistoryInspectorOpened = defineEvent<DocumentHistoryInspectorOpenedInfo>({
  name: 'Document History Inspector Opened',
  version: 1,
  description: 'User opened the history and review changes inspector',
})

interface DocumentHistoryInspectorTabChangedInfo {
  /** Tab being switched to */
  tab: ChangesInspectorTab
  /** Tab being switched away from */
  previousTab: ChangesInspectorTab
}

/**
 * @internal
 */
export const DocumentHistoryInspectorTabChanged =
  defineEvent<DocumentHistoryInspectorTabChangedInfo>({
    name: 'Document History Inspector Tab Changed',
    version: 1,
    description: 'User changed the active tab in the history and review changes inspector',
  })

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
