import React, {createContext, useContext} from 'react'
import vars from 'sanity:css-custom-properties'

const defaults = {
  pane: parseInt(vars['--zindex-pane'], 10) || 900,
  navbar: parseInt(vars['--zindex-navbar'], 10) || 1000,
  navbarFixed: parseInt(vars['--zindex-navbar-fixed'], 10) || 1010,
  dropdown: parseInt(vars['--zindex-dropdown'], 10) || 1010,
  fullscreenEdit: parseInt(vars['--zindex-fullscreen-edit'], 10) || 1050,
  portal: parseInt(vars['--zindex-portal'], 10) || 1060,
  popoverBackground: parseInt(vars['--zindex-popover-background'], 10) || 1060,
  popover: parseInt(vars['--zindex-popover'], 10) || 1070,
  tooltip: parseInt(vars['--zindex-tooltip'], 10) || 1100,
  modalBackground: parseInt(vars['--zindex-modal-background'], 10) || 2000,
  modal: parseInt(vars['--zindex-modal'], 10) || 2010,
  movingItem: parseInt(vars['--zindex-moving-item'], 10) || 3000,
  spinner: parseInt(vars['--zindex-spinner'], 10) || 3000,
  drawershade: parseInt(vars['--zindex-drawershade'], 10) || 4000,
  drawer: parseInt(vars['--zindex-drawer'], 10) || 4001,
}

const ZIndexContext = createContext(defaults)

export function useZIndex() {
  return useContext(ZIndexContext)
}

export function ZIndexProvider({children}: {children?: React.ReactNode}) {
  return <ZIndexContext.Provider value={defaults}>{children}</ZIndexContext.Provider>
}
