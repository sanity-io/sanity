import {defineLocalesResources} from '../../i18n/helpers'

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
    'Open this document in Dashboard to link to Canvas',
  /** The text for the "Link to Canvas" action when the user doesn't have permissions to link the document to Canvas. */
  'action.link-document-disabled.missing-permissions':
    "You don't have permissions to link this document to Canvas",
  /** The text for the "Link to Canvas" action when the document is a version document. */
  'action.link-document-disabled.version-document':
    'Version documents are not yet supported in Canvas',
  /** The text for the "Link to Canvas" action when the document is not yet resolved. */
  'action.link-document-disabled.initial-value-not-resolved':
    'Please wait until the document initial values are resolved',
  /** The text for the "Unlink from Canvas" action. */
  'action.unlink-document': 'Unlink from Canvas',
  /** The text for the "Edit in Canvas" action. */
  'action.edit-document': 'Edit in Canvas',
  /** The text for the banner when the document is linked to Canvas. */
  'banner.linked-to-canvas': 'This document is linked to Canvas',
  /** The text for the action button in the banner when the document is linked to Canvas. */
  'banner.edit-document-in-canvas': 'Edit in Canvas',

  /** The title for the "Confirm document changes" dialog. */
  'dialog.confirm-document-changes.title': 'Confirm document changes',
  /** The description for the "Confirm document changes" dialog. */
  'dialog.confirm-document-changes.description':
    'This document needs to be updated to be compatible with Canvas.\n Existing content may be edited or removed as part of this process.',
  /** The text for the "Confirm document changes" dialog confirm button. */
  'dialog.confirm-document-changes.confirm': 'Accept and continue',
  /** The text for the "Confirm document changes" dialog cancel button. */
  'dialog.confirm-document-changes.cancel': 'Cancel',
  /** The description for the "Confirm document changes" dialog footer. */
  'dialog.confirm-document-changes.footer-description': 'You can unlink from Canvas at any time',

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
    'Once unlinked, it will be editable here and future edits in Canvas will no longer automatically map to this document.',
  /** The text for the "Unlink from Canvas" dialog success message. */
  'dialog.unlink-from-canvas.success': 'Unlinked from Canvas',
  /** The text for the "Unlink from Canvas" dialog error message. */
  'dialog.unlink-from-canvas.error': 'Failed to unlink from Canvas',
  /** The text for the "Navigate to Canvas" dialog error message. */
  'navigate-to-canvas-doc.error.missing-permissions': 'Missing permissions to navigate to Canvas',
})

/**
 * @alpha
 */
export type CanvasLocaleResourceKeys = keyof typeof canvasLocaleStrings

export default canvasLocaleStrings
