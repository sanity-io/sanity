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

// timeline
export const TIMELINE_LIST_WRAPPER_ID = 'timeline-list-wrapper'

// history / review changes inspector tabs
const CHANGES_INSPECTOR_TABS = ['history', 'review'] as const

export type ChangesInspectorTab = (typeof CHANGES_INSPECTOR_TABS)[number]

export function resolveChangesInspectorTab(tab: string | undefined): ChangesInspectorTab {
  return CHANGES_INSPECTOR_TABS.find((candidate) => candidate === tab) ?? CHANGES_INSPECTOR_TABS[0]
}
