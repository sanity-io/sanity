import {type I18nTextRecord, type SortOrderingItem} from '@sanity/types'

import {type _PaneMenuItem} from '../components/pane/types'
import {type Intent} from './intent'

/**
 * Menu item action type
 * @public */
export type MenuItemActionType =
  | string
  | ((params: Record<string, unknown> | undefined, scope?: unknown) => void)

/**
 * Known menu item parameters that control built-in behavior.
 * These properties have specific meanings in the structure builder.
 *
 * @public */
export interface KnownMenuItemParams {
  /**
   * When true, hides all visual indicators showing this menu item is selected.
   * This includes both the checkmark icon and the pressed/selected styling.
   * The item can still be selected - this only affects the visual feedback.
   * Useful when you want the menu item to perform an action without showing a selection state.
   */
  hideSelectionIndicator?: boolean

  /**
   * The value to associate with this menu item for tracking selected state.
   * Used with the 'setMenuItemState' action for custom toggle behavior.
   * When a menu item is clicked, this value is stored against the menu item's `id`.
   * Defaults to `true` if not specified.
   */
  value?: unknown

  /**
   * Layout key for layout switching menu items.
   * Used with the 'setLayout' action.
   */
  layout?: string

  /**
   * Sort ordering configuration for sort menu items.
   * Used with the 'setSortOrder' action.
   */
  by?: SortOrderingItem[]
}

/**
 * Menu items parameters.
 * Includes known parameters that control built-in behavior,
 * plus allows additional custom parameters.
 *
 * @public */
export type MenuItemParamsType = KnownMenuItemParams & Record<string, unknown>

/**
 * Represents what can be passed into `menuItems` inside of panes
 *
 * @internal
 */
export interface PaneMenuItem {
  /**
   * Unique identifier for the menu item.
   * Used for tracking selected state of custom menu items.
   * Menu items with the same id will share selected state (like radio buttons).
   */
  id?: string
  /**
   * The i18n key and namespace used to populate the localized title. This is
   * the recommend way to set the title if you are localizing your studio.
   */
  i18n?: I18nTextRecord<'title'>
  /**
   * Menu Item title. Note that the `i18n` configuration will take
   * precedence and this title is left here as a fallback if no i18n key is
   * provided and compatibility with older plugins
   */
  title: string
  /** Menu Item action */
  action?: MenuItemActionType
  /** Menu Item intent */
  intent?: Intent
  /** Menu Item group */
  group?: string
  /** Menu Item icon */
  icon?: React.ComponentType | React.ReactNode
  /** Menu Item parameters. See {@link MenuItemParamsType} */
  params?: MenuItemParamsType
  /** Determine if it will show the MenuItem as action */
  showAsAction?: boolean
  disabled?: _PaneMenuItem['disabled']
  shortcut?: string
  selected?: boolean
  tone?: 'primary' | 'positive' | 'caution' | 'critical'
}

/** @internal */
export interface PaneMenuItemGroup {
  id: string
  title?: string
  i18n?: I18nTextRecord<'title'>
}
