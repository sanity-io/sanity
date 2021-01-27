import React, {createContext, useContext} from 'react'
import vars from 'sanity:css-custom-properties'

const defaults = {
  /*
    used by
    - Navbar
  */
  navbar: parseInt(vars['--zindex-navbar'], 10) || 200,
  navbarPopover: parseInt(vars['--zindex-navbar-popover'], 10) || 500000,
  navbarDialog: parseInt(vars['--zindex-navbar-dialog'], 10) || 500001,

  /*
    used by:
    - DefaultPane
  */
  pane: parseInt(vars['--zindex-pane'], 10) || 100,

  /*
    used by:
    - DefaultPane
  */
  paneResizer: parseInt(vars['--zindex-pane-resizer'], 10) || 150,

  /*
    used by:
    - EditItemFoldOut
    - Spinner
    - ConnectorsOverlay
    - tippy.css
    - BaseDateTimeInput
  */
  portal: parseInt(vars['--zindex-portal'], 10) || 200,

  /*
    used by tooltip
  */
  popover: parseInt(vars['--zindex-popover'], 10) || 200,

  /*
    used by google-maps-input
  */
  modal: parseInt(vars['--zindex-modal'], 10) || 200,

  /*
    used for movingItem in:
    packages/@sanity/base/src/styles/layout/helpers.css
  */
  movingItem: parseInt(vars['--zindex-moving-item'], 10) || 10000,

  /*
    used for shadow behind the navbar search, and behind sidemenu
  */
  drawershade: parseInt(vars['--zindex-drawershade'], 10) || 1000000,

  /*
    used for snackbar
  */
  drawer: parseInt(vars['--zindex-drawer'], 10) || 1000001,

  // NOT IN USE
  dropdown: parseInt(vars['--zindex-dropdown'], 10) || 200,
  navbarFixed: parseInt(vars['--zindex-navbar-fixed'], 10) || 1010,
  fullscreenEdit: parseInt(vars['--zindex-fullscreen-edit'], 10) || 1050,
  popoverBackground: parseInt(vars['--zindex-popover-background'], 10) || 1060,
  tooltip: parseInt(vars['--zindex-tooltip'], 10) || 200,
  modalBackground: parseInt(vars['--zindex-modal-background'], 10) || 2000,
  spinner: parseInt(vars['--zindex-spinner'], 10) || 3000,
}

const ZIndexContext = createContext(defaults)

export function useZIndex() {
  return useContext(ZIndexContext)
}

export function ZIndexProvider({children}: {children?: React.ReactNode}) {
  return <ZIndexContext.Provider value={defaults}>{children}</ZIndexContext.Provider>
}
