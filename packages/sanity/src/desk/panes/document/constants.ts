import {PaneRouterContextValue} from '../../components'
import {PaneMenuItemGroup} from '../../types'

export const DOCUMENT_PANEL_MIN_WIDTH = 320
export const DOCUMENT_PANEL_INITIAL_MIN_WIDTH = 600

export const DOCUMENT_INSPECTOR_MIN_WIDTH = 320
export const DOCUMENT_INSPECTOR_MAX_WIDTH = 540

export const EMPTY_PARAMS: NonNullable<PaneRouterContextValue['params']> = {}

export const INSPECT_ACTION_PREFIX = 'inspect:'

export const DEFAULT_MENU_ITEM_GROUPS: PaneMenuItemGroup[] = [{id: 'inspectors'}, {id: 'links'}]

// inspectors
export const HISTORY_INSPECTOR_NAME = 'sanity/desk/history'
export const VALIDATION_INSPECTOR_NAME = 'sanity/desk/validation'
