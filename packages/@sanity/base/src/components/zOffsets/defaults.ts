import {ZIndexContextValue} from './types'

/**
 * @internal
 */
export const defaults: ZIndexContextValue = {
  navbar: 200,
  navbarPopover: 500000,
  navbarDialog: 500001,

  // pane
  pane: 100,
  paneHeader: [110, 15000],
  paneFooter: [120, 20000],
  paneResizer: [130, 25000],

  //
  popover: 200,
  modal: 200,
  movingItem: 10000,
  drawershade: 1000000,
  drawer: 1000001,
  fullscreen: 1200000,
  toast: [100, 11000],

  // NOT IN USE
  portal: 200,
  dropdown: 200,
  navbarFixed: 1010,
  fullscreenEdit: 1050,
  popoverBackground: 1060,
  tooltip: 200,
  modalBackground: 2000,
  spinner: 3000,
}
