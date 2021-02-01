import React, {createContext, useContext} from 'react'
import cssCustomProperties from 'sanity:css-custom-properties'

function getCustomCSSPropertyNumber(key: string): number | undefined {
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

const defaults = {
  /*
    used by
    - Navbar
  */
  navbar: getCustomCSSPropertyNumber('--zindex-navbar') || 200,
  navbarPopover: getCustomCSSPropertyNumber('--zindex-navbar-popover') || 500000,
  navbarDialog: getCustomCSSPropertyNumber('--zindex-navbar-dialog') || 500001,

  /*
    used by:
    - DefaultPane
  */
  pane: getCustomCSSPropertyNumber('--zindex-pane') || 100,

  /*
    used by:
    - DefaultPane
  */
  paneResizer: getCustomCSSPropertyNumber('--zindex-pane-resizer') || 150,

  /*
    used by:
    - EditItemFoldOut
    - Spinner
    - ConnectorsOverlay
    - tippy.css
    - BaseDateTimeInput
  */
  portal: getCustomCSSPropertyNumber('--zindex-portal') || 200,

  /*
    used by tooltip
  */
  popover: getCustomCSSPropertyNumber('--zindex-popover') || 200,

  /*
    used by google-maps-input
  */
  modal: getCustomCSSPropertyNumber('--zindex-modal') || 200,

  /*
    used for `movingItem` in:
    packages/@sanity/base/src/styles/layout/helpers.css
  */
  movingItem: getCustomCSSPropertyNumber('--zindex-moving-item') || 10000,

  /*
    used for shadow behind the navbar search, and behind sidemenu
  */
  drawershade: getCustomCSSPropertyNumber('--zindex-drawershade') || 1000000,

  /*
    used for snackbar
  */
  drawer: getCustomCSSPropertyNumber('--zindex-drawer') || 1000001,

  // NOT IN USE
  dropdown: getCustomCSSPropertyNumber('--zindex-dropdown') || 200,
  navbarFixed: getCustomCSSPropertyNumber('--zindex-navbar-fixed') || 1010,
  fullscreenEdit: getCustomCSSPropertyNumber('--zindex-fullscreen-edit') || 1050,
  popoverBackground: getCustomCSSPropertyNumber('--zindex-popover-background') || 1060,
  tooltip: getCustomCSSPropertyNumber('--zindex-tooltip') || 200,
  modalBackground: getCustomCSSPropertyNumber('--zindex-modal-background') || 2000,
  spinner: getCustomCSSPropertyNumber('--zindex-spinner') || 3000,
}

const ZIndexContext = createContext(defaults)

export function useZIndex() {
  return useContext(ZIndexContext)
}

export function ZIndexProvider({children}: {children?: React.ReactNode}) {
  return <ZIndexContext.Provider value={defaults}>{children}</ZIndexContext.Provider>
}
