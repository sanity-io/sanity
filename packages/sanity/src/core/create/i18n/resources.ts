import {defineLocalesResources} from '../../i18n'

/**
 * Defined locale strings for the Create integration feature, in US English.
 *
 * @internal
 */
const createLocaleStrings = defineLocalesResources('comments', {
  /** "Start in Sanity Create" action button text */
  'start-in-create-action.label': 'Start in Sanity Create',

  /** Header of the "Start writing in Create" dialog */
  'start-in-create-dialog.header': 'Start authoring with Sanity Create?',
  /** The lede text in the "Start writing in Create" dialog */
  'start-in-create-dialog.lede':
    'Map your free-form ideas back to the Studio as structured content whilst you write.',
  /** The details on what "Start writing in Create" implies */
  'start-in-create-dialog.details':
    'This will open Sanity Create in a new window and automatically link this document.',
  /** CTA in "Start writing in Create" dialog: Continue to create */
  'start-in-create-dialog.cta.continue': 'Continue',
  /** CTA in "Start writing in Create" dialog: Learn more */
  'start-in-create-dialog.cta.learn-more': 'Learn more',
  /** Text for checkbox in "Start writing in Create" dialog for disabling the dialog in the future */
  'start-in-create-dialog.dont-remind-me-checkbox': 'Don’t remind me again',

  /** Header of the "Linking in progress" dialog */
  'linking-in-progress-dialog.header': 'Linking in progress',
  /** Lede text for the "Linking in progress" dialog */
  'linking-in-progress-dialog.lede': 'This document is being linked with Create.',
  /** Details for the "Linking in progress" dialog */
  'linking-in-progress-dialog.details':
    'You should continue editing in Create. Content will show up in this document as it is mapped into it.',
  /** Info on when the "Linking in progress" dialog will close */
  'linking-in-progress-dialog.auto-close':
    'This dialog will close once content start flowing from Create.',

  /** Text for the document pane banner informing users that the document is linked to Sanity Create */
  'studio-create-link-banner.text': 'This document is linked to Sanity Create',

  /** Tooltip for Create Link button */
  'create-link-info.tooltip': 'Sanity Create information',
  /** Text above header in Create Link info popover */
  'create-link-info-popover.eyebrow-title': 'Sanity Create',
  /** Text in badge above header in Create Link info popover */
  'create-link-info-popover.eyebrow-badge': 'Beta',
  /** Header in Create Link info popover */
  'create-link-info-popover.header': 'Gather, contextualize, realize',
  /** Informational text in Create Link info popover */
  'create-link-info-popover.text':
    'Map your free-form ideas back to the Studio as <em>structured content</em> whilst you write.',

  /** Edit in Create button text */
  'edit-in-create-button.text': 'Edit in Sanity Create',
  /** Unlink document from Sanity Create button text */
  'unlink-from-create-button.text': 'Unlink',

  /** Unlink from Create dialog header */
  'unlink-from-create-dialog.header': 'Unlink from Sanity Create?',
  /** Unlink from Create dialog – first informational paragraph */
  'unlink-from-create-dialog.first-paragraph':
    'You’re unlinking <strong>“{{title}}”</strong> from Sanity Create so it can be edited here.',
  /** Unlink from Create dialog – second informational paragraph */
  'unlink-from-create-dialog.second-paragraph':
    'You’ll keep all of your current changes, but future edits made in Create will no longer be automatically transferred here.',
  /** Unlink from Create dialog: Cancel button text */
  'unlink-from-create-dialog.cancel.text': 'Cancel',
  /** Unlink from Create dialog: Unlink button text */
  'unlink-from-create-dialog.unlink.text': 'Unlink now',
})

/**
 * @alpha
 */
export type CreateLocaleResourceKeys = keyof typeof createLocaleStrings

export default createLocaleStrings
