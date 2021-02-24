/**
 * @todo: Rename to `ZOffsetsContextValue`
 *
 * @internal
 */
export interface ZIndexContextValue {
  /** Used by: Navbar */
  navbar: number
  navbarPopover: number
  navbarDialog: number

  /** Used by: DefaultPane, DocumentPane */
  pane: number
  paneHeader: number
  paneFooter: number
  paneResizer: number

  /** Used by: EditItemFoldOut, Spinner, ConnectorsOverlay, tippy.css, BaseDateTimeInput */
  portal: number

  /** Used by: Tooltip */
  popover: number

  /** Used by: @sanity/google-maps-input */
  modal: number

  /** Used by: `movingItem` in packages/@sanity/base/src/styles/layout/helpers.css */
  movingItem: number

  /** Used for shadow behind the navbar search, and behind sidemenu */
  drawershade: number

  /** Used by: Snackbar */
  drawer: number

  /** Used for UI that sits on top of the entire application */
  fullscreen: number

  // THESE ARE NOT IN USE:
  dropdown: number
  navbarFixed: number
  fullscreenEdit: number
  popoverBackground: number
  tooltip: number
  modalBackground: number
  spinner: number
}
