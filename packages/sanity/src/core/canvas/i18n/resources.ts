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
  /** The text for the Link to Canvas dialog when there is a error. */
  'dialog.link-to-canvas.error': 'Failed to link to Canvas',

  /** The title for the "Unlink from Canvas" dialog. */
  'dialog.unlink-from-canvas.title': 'Unlink from Canvas',
  /** The text for the "Unlink from Canvas" dialog when the document is being unlinked. */
  'dialog.unlink-from-canvas.unlinking':
    "You're unlinking  <strong>“{{documentTitle}}”</strong> from Canvas.",
  /** The text for the "Unlink from Canvas" dialog cancel button. */
  'dialog.unlink-from-canvas.cancel': 'Cancel',
  /** The text for the "Unlink from Canvas" dialog unlink button. */
  'dialog.unlink-from-canvas.unlink-action': 'Unlink now',
  /** The text for the "Unlink from Canvas" dialog description. */
  'dialog.unlink-from-canvas.description':
    'Once unlinked, it will be editable here with current changes and future edits made in Canvas will no longer be automatically mapped to this document.',
  /** The text for the "Unlink from Canvas" dialog success message. */
  'dialog.unlink-from-canvas.success': 'Unlinked from Canvas',
  /** The text for the "Unlink from Canvas" dialog error message. */
  'dialog.unlink-from-canvas.error': 'Failed to unlink from Canvas',
})

/**
 * @alpha
 */
export type CanvasLocaleResourceKeys = keyof typeof canvasLocaleStrings

export default canvasLocaleStrings
