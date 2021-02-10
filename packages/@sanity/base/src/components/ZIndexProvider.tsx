import React, {createContext, useContext, useMemo} from 'react'
import cssCustomProperties from 'sanity:css-custom-properties'

interface ZIndexContextValue {
  navbar: number
  navbarPopover: number
  navbarDialog: number
  pane: number
  paneResizer: number
  portal: number
  popover: number
  modal: number
  movingItem: number
  drawershade: number
  drawer: number

  // NOT IN USE
  dropdown: number
  navbarFixed: number
  fullscreenEdit: number
  popoverBackground: number
  tooltip: number
  modalBackground: number
  spinner: number
}

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

const defaults: ZIndexContextValue = {
  navbar: 200,
  navbarPopover: 500000,
  navbarDialog: 500001,
  pane: 100,
  paneResizer: 150,
  portal: 200,
  popover: 200,
  modal: 200,
  movingItem: 10000,
  drawershade: 1000000,
  drawer: 1000001,

  // NOT IN USE
  dropdown: 200,
  navbarFixed: 1010,
  fullscreenEdit: 1050,
  popoverBackground: 1060,
  tooltip: 200,
  modalBackground: 2000,
  spinner: 3000,
}

function getLegacyZIndexes(): ZIndexContextValue {
  return {
    /*
      used by
      - Navbar
    */
    navbar: getCustomCSSPropertyNumber('--zindex-navbar') || defaults.navbar,
    navbarPopover: getCustomCSSPropertyNumber('--zindex-navbar-popover') || defaults.navbarPopover,
    navbarDialog: getCustomCSSPropertyNumber('--zindex-navbar-dialog') || defaults.navbarDialog,

    /*
      used by:
      - DefaultPane
    */
    pane: getCustomCSSPropertyNumber('--zindex-pane') || defaults.pane,

    /*
      used by:
      - DefaultPane
    */
    paneResizer: getCustomCSSPropertyNumber('--zindex-pane-resizer') || defaults.paneResizer,

    /*
      used by:
      - EditItemFoldOut
      - Spinner
      - ConnectorsOverlay
      - tippy.css
      - BaseDateTimeInput
    */
    portal: getCustomCSSPropertyNumber('--zindex-portal') || defaults.portal,

    /*
      used by tooltip
    */
    popover: getCustomCSSPropertyNumber('--zindex-popover') || defaults.popover,

    /*
      used by google-maps-input
    */
    modal: getCustomCSSPropertyNumber('--zindex-modal') || defaults.modal,

    /*
      used for `movingItem` in:
      packages/@sanity/base/src/styles/layout/helpers.css
    */
    movingItem: getCustomCSSPropertyNumber('--zindex-moving-item') || defaults.movingItem,

    /*
      used for shadow behind the navbar search, and behind sidemenu
    */
    drawershade: getCustomCSSPropertyNumber('--zindex-drawershade') || defaults.drawershade,

    /*
      used for snackbar
    */
    drawer: getCustomCSSPropertyNumber('--zindex-drawer') || defaults.drawer,

    // NOT IN USE
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

const ZIndexContext = createContext<ZIndexContextValue>(defaults)

export function useZIndex(): ZIndexContextValue {
  return useContext(ZIndexContext)
}

export function ZIndexProvider({children}: {children?: React.ReactNode}): React.ReactElement {
  const zIndexes = useMemo(() => getLegacyZIndexes(), [])

  return <ZIndexContext.Provider value={zIndexes}>{children}</ZIndexContext.Provider>
}
