import {type ResponsiveProp} from '@sanity/ui/css'

/**
 * TODO: Rename to `ZOffsetsContextValue`
 *
 * @internal
 */
export interface ZIndexContextValue {
  /** Used by: Navbar */
  navbar: ResponsiveProp<number>
  navbarPopover: ResponsiveProp<number>
  navbarDialog: ResponsiveProp<number>

  /** Used by: DefaultPane, DocumentPane */
  pane: ResponsiveProp<number>
  paneHeader: ResponsiveProp<number>
  paneFooter: ResponsiveProp<number>
  paneResizer: ResponsiveProp<number>
  paneDialog: ResponsiveProp<number>

  /** Used by: EditItemFoldOut, Spinner, ConnectorsOverlay, tippy.css, BaseDateTimeInput */
  portal: ResponsiveProp<number>

  /** Used by: Tooltip */
  popover: ResponsiveProp<number>

  /** Used by: `@sanity/google-maps-input` */
  modal: ResponsiveProp<number>

  /** TODO this path does not seem to be correct - fix?  */
  /** Used by: `movingItem` in packages/sanity/src/styles/layout/helpers.css */
  movingItem: ResponsiveProp<number>

  /** Used for shadow behind the navbar search, and behind sidemenu */
  drawershade: ResponsiveProp<number>

  /** Used by: Snackbar */
  drawer: ResponsiveProp<number>

  /** Used for UI that sits on top of the entire application */
  fullscreen: ResponsiveProp<number>

  /** Used for toasts */
  toast: ResponsiveProp<number>

  // THESE ARE NOT IN USE:
  dropdown: ResponsiveProp<number>
  navbarFixed: ResponsiveProp<number>
  fullscreenEdit: ResponsiveProp<number>
  popoverBackground: ResponsiveProp<number>
  tooltip: ResponsiveProp<number>
  modalBackground: ResponsiveProp<number>
  spinner: ResponsiveProp<number>
}
