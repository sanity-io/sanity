/**
 * @todo: Rename to `ZOffsetsContextValue`
 *
 * @internal
 */
export interface ZIndexContextValue {
  /** Used by: Navbar */
  navbar: number | number[]
  navbarPopover: number | number[]
  navbarDialog: number | number[]

  /** Used by: DefaultPane, DocumentPane */
  pane: number | number[]
  paneHeader: number | number[]
  paneFooter: number | number[]
  paneResizer: number | number[]

  /** Used by: EditItemFoldOut, Spinner, ConnectorsOverlay, tippy.css, BaseDateTimeInput */
  portal: number | number[]

  /** Used by: Tooltip */
  popover: number | number[]

  /** Used by: `@sanity/google-maps-input` */
  modal: number | number[]

  /** @todo this path does not seem to be correct - fix?  */
  /** Used by: `movingItem` in packages/sanity/src/styles/layout/helpers.css */
  movingItem: number | number[]

  /** Used for shadow behind the navbar search, and behind sidemenu */
  drawershade: number | number[]

  /** Used by: Snackbar */
  drawer: number | number[]

  /** Used for UI that sits on top of the entire application */
  fullscreen: number | number[]

  /** Used for toasts */
  toast: number | number[]

  // THESE ARE NOT IN USE:
  dropdown: number | number[]
  navbarFixed: number | number[]
  fullscreenEdit: number | number[]
  popoverBackground: number | number[]
  tooltip: number | number[]
  modalBackground: number | number[]
  spinner: number | number[]
}
