import {type PaneRouterContextValue} from '../../components/paneRouter/types'
import {type PaneMenuItemGroup} from '../../types'

export const DOCUMENT_PANEL_MIN_WIDTH = 320
export const DOCUMENT_PANEL_INITIAL_MIN_WIDTH = 600

export const DOCUMENT_INSPECTOR_MIN_WIDTH = 320
export const DOCUMENT_INSPECTOR_MAX_WIDTH = 540

export const EMPTY_PARAMS: NonNullable<PaneRouterContextValue['params']> = {}

export const INSPECT_ACTION_PREFIX = 'inspect:'

export const DEFAULT_MENU_ITEM_GROUPS: PaneMenuItemGroup[] = [{id: 'inspectors'}, {id: 'links'}]

// inspectors
export const HISTORY_INSPECTOR_NAME = 'sanity/structure/history'
export const VALIDATION_INSPECTOR_NAME = 'sanity/structure/validation'
export const INCOMING_REFERENCES_INSPECTOR_NAME = 'sanity/structure/incoming-references'
export const DOCUMENT_GROUP_INSPECTOR_NAME = 'sanity/structure/document-group'

/**
 * Document pane param that asks for a variant to be created, as `createVariant=<variant id>`, set
 * next to `inspect=<DOCUMENT_GROUP_INSPECTOR_NAME>`. The pane opens in that variant and the current
 * release, where the variant has no version yet.
 *
 * - The document list's versions flyout writes it when the picked variant has no version in the
 *   release in view.
 * - The document inventory reads it: it opens the Create variant form pre-filled (Variant = the param,
 *   Add to = the current release, Start from = the nearest version) with focus on Create. Creating
 *   or cancelling removes the param, replacing the history entry.
 * - The variant banner reads it: while it is set and the document inventory is open, the banner
 *   keeps its sentence but drops its Create action, and points to the form instead.
 *
 * Without the param, all three behave as before.
 */
export const CREATE_VARIANT_PARAM = 'createVariant'

// timeline
export const TIMELINE_LIST_WRAPPER_ID = 'timeline-list-wrapper'
