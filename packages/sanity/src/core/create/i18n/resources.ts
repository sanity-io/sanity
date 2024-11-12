import {defineLocalesResources} from '../../i18n'

/**
 * Defined locale strings for the Create integration feature, in US English.
 *
 * @internal
 */
const createLocaleStrings = defineLocalesResources('create', {
  /** "Start in Sanity Create" action button text */
  'start-in-create-action.label': 'Start in Sanity Create',

  /** Header of the "Start writing in Create" dialog */
  'start-in-create-dialog.header': 'Start authoring in Sanity Create',
  /** The lede text in the "Start writing in Create" dialog */
  'start-in-create-dialog.lede':
    'Author in a free-form editor and have it mapped back to the Studio as structured content, as you type.',
  /** The details on what "Start writing in Create" implies */
  'start-in-create-dialog.details':
    'This will open Sanity Create in a new window and automatically link it to this document.',
  /** CTA in "Start writing in Create" dialog: Continue to create */
  'start-in-create-dialog.cta.continue': 'Continue',
  /** CTA in "Start writing in Create" dialog: Learn more */
  'start-in-create-dialog.cta.learn-more': 'Learn more',
  /** Text for checkbox in "Start writing in Create" dialog for disabling the dialog in the future */
  'start-in-create-dialog.dont-remind-me-checkbox': 'Don’t remind me again',
  /** Toast error message when we dont have a resolved Sanity Create url*/
  'start-in-create-dialog.error-toast.unresolved-url': 'Unable to determine Sanity Create URL.',

  /** Header of the "Linking in progress" dialog */
  'linking-in-progress-dialog.header': 'Linking in progress',
  /** Lede text for the "Linking in progress" dialog */
  'linking-in-progress-dialog.lede':
    'Please return to Sanity Create. Linking the document should only take a few seconds.',
  /** Details for the "Linking in progress" dialog */
  'linking-in-progress-dialog.details':
    'When complete, this dialog will close and edits made in Sanity Create will start appearing here as they happen.',
  /** "Linking in progress" troubleshooting button title */
  'linking-in-progress-dialog.troubleshooting.button.title': 'Linking taking a while?',
  /** "Linking in progress" troubleshooting content */
  'linking-in-progress-dialog.troubleshooting.content':
    'Did you close the Sanity Create window? Does the process appear to be stuck? Please reload this page and try again.',
  /** Text for the document pane banner informing users that the document is linked to Sanity Create */
  'studio-create-link-banner.text': 'This document is linked to Sanity Create',

  /** Tooltip for Create Link button */
  'create-link-info.tooltip': 'Learn more',
  /** Text above header in Create Link info popover */
  'create-link-info-popover.eyebrow-title': 'Sanity Create',
  /** Text in badge above header in Create Link info popover */
  'create-link-info-popover.eyebrow-badge': 'Beta',
  /** Header in Create Link info popover */
  'create-link-info-popover.header': 'Idea first authoring',
  /** Informational text in Create Link info popover */
  'create-link-info-popover.text':
    'Sanity Create lets you author in a free-form editor that automatically maps back to the Studio as structured content - as you type.',

  /** Edit in Create button text */
  'edit-in-create-button.text': 'Edit in Sanity Create',
  /** Unlink document from Sanity Create button text */
  'unlink-from-create-button.text': 'Unlink',

  /** Unlink from Create dialog header */
  'unlink-from-create-dialog.header': 'Unlink from Sanity Create?',
  /** Unlink from Create dialog – first informational paragraph */
  'unlink-from-create-dialog.first-paragraph':
    'You’re unlinking “<strong>{{title}}</strong>” from Sanity Create so it can be edited here.',
  /** Unlink from Create dialog – second informational paragraph */
  'unlink-from-create-dialog.second-paragraph':
    'You’ll keep all of your current changes, but future edits made in Create will no longer be automatically transferred here.',
  /** Unlink from Create dialog: Cancel button text */
  'unlink-from-create-dialog.cancel.text': 'Cancel',
  /** Unlink from Create dialog: Document title used if no other title can be determined */
  'unlink-from-create-dialog.document.untitled.text': 'Untitled',
  /** Unlink from Create dialog: Unlink button text */
  'unlink-from-create-dialog.unlink.text': 'Unlink now',
})

/**
 * @alpha
 */
export type CreateLocaleResourceKeys = keyof typeof createLocaleStrings

export default createLocaleStrings
