// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import cssCustomProperties from 'sanity:css-custom-properties'
import {defaults} from './defaults'
import {ZIndexContextValue} from './types'

/**
 * @internal
 */
export function getLegacyZIndexes(): ZIndexContextValue {
  return {
    navbar: getCustomCSSPropertyNumber('--zindex-navbar') || defaults.navbar,
    navbarPopover: getCustomCSSPropertyNumber('--zindex-navbar-popover') || defaults.navbarPopover,
    navbarDialog: getCustomCSSPropertyNumber('--zindex-navbar-dialog') || defaults.navbarDialog,
    pane: getCustomCSSPropertyNumber('--zindex-pane') || defaults.pane,
    paneHeader: defaults.paneHeader,
    paneFooter: defaults.paneFooter,
    paneResizer: getCustomCSSPropertyNumber('--zindex-pane-resizer') || defaults.paneResizer,
    portal: getCustomCSSPropertyNumber('--zindex-portal') || defaults.portal,
    popover: getCustomCSSPropertyNumber('--zindex-popover') || defaults.popover,
    modal: getCustomCSSPropertyNumber('--zindex-modal') || defaults.modal,
    movingItem: getCustomCSSPropertyNumber('--zindex-moving-item') || defaults.movingItem,
    drawershade: getCustomCSSPropertyNumber('--zindex-drawershade') || defaults.drawershade,
    drawer: getCustomCSSPropertyNumber('--zindex-drawer') || defaults.drawer,
    fullscreen: defaults.fullscreen,
    toast: defaults.toast,

    // THESE ARE NOT IN USE:
    dropdown: getCustomCSSPropertyNumber('--zindex-dropdown') || defaults.dropdown,
    navbarFixed: getCustomCSSPropertyNumber('--zindex-navbar-fixed') || defaults.navbarFixed,
    fullscreenEdit:
      getCustomCSSPropertyNumber('--zindex-fullscreen-edit') || defaults.fullscreenEdit,
    popoverBackground:
      getCustomCSSPropertyNumber('--zindex-popover-background') || defaults.popoverBackground,
    tooltip: getCustomCSSPropertyNumber('--zindex-tooltip') || defaults.tooltip,
    modalBackground:
      getCustomCSSPropertyNumber('--zindex-modal-background') || defaults.modalBackground,
    spinner: getCustomCSSPropertyNumber('--zindex-spinner') || defaults.spinner,
  }
}

/**
 * @internal
 */
export function getCustomCSSPropertyNumber(key: string): number | undefined {
  const rawValue = cssCustomProperties[key]

  if (rawValue === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`getCustomCSSPropertyNumber: the custom CSS property "${key}" is not defined`)
    return undefined
  }

  const value = parseInt(rawValue, 10)

  if (isNaN(value)) {
    // eslint-disable-next-line no-console
    console.warn(`getCustomCSSPropertyNumber: the custom CSS property "${key}" is not a number`)
    return undefined
  }

  return value
}
