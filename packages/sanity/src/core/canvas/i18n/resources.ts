import {defineLocalesResources} from '../../i18n'

/**
 * Defined locale strings for the Canvas integration feature, in US English.
 *
 * @internal
 */
const canvasLocaleStrings = defineLocalesResources('canvas', {
  /** The text for the "Link to Canvas" action. */
  'action.link-document': 'Link to Canvas',

  /** The text for the "Link to Canvas" action when the document is not in the dashboard. */
  'action.link-document-disabled.not-in-dashboard':
    'To use this action open this document in Dashboard',
  /** The text for the "Link to Canvas" action when the document is a version document. */
  'action.link-document-disabled.version-document':
    'Version documents are not yet supported in Canvas',
  /** The text for the "Unlink from Canvas" action. */
  'action.unlink-document': 'Unlink from Canvas',
  /** The text for the "Edit in Canvas" action. */
  'action.edit-document': 'Edit in Canvas',
  /** The text for the banner when the document is linked to Canvas. */
  'banner.linked-to-canvas': 'This document is linked to Canvas',
  /** The text for the action button in the banner when the document is linked to Canvas. */
  'banner.edit-document-in-canvas': 'Edit in Canvas',

  /** The title for the "Link to Canvas" dialog. */
  'dialog.link-to-canvas.title': 'Link to Canvas',
  /** The text for the "Link to Canvas" dialog when the document is being validated. */
  'dialog.link-to-canvas.validating': 'Validating',
  /** The text for the "Link to Canvas" dialog when the document is being redirected. */
  'dialog.link-to-canvas.redirecting': 'Taking you to Canvas to complete linking...',
})

/**
 * @alpha
 */
export type CanvasLocaleResourceKeys = keyof typeof canvasLocaleStrings

export default canvasLocaleStrings
