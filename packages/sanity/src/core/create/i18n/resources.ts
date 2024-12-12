import {defineLocalesResources} from '../../i18n'

/**
 * Defined locale strings for the Create integration feature, in US English.
 *
 * @internal
 */
const createLocaleStrings = defineLocalesResources('create', {
  /** "Start in Sanity Create" link button text */
  'start-in-create-link.label': 'Start in Create',

  /** Header of the "Start writing in Create" banner */
  'start-in-create-banner.title': 'Get started with Sanity Create',
  /** Header badge of the "Start writing in Create" banner */
  'start-in-create-banner.title-badge': 'Early access',
  /** Subtitle of the "Start writing in Create" banner */
  'start-in-create-banner.subtitle':
    'A free-form, AI-powered editor that syncs directly with your Studio documents.',

  /** CTA in "Start writing in Create" dialog: Learn more */
  'start-in-create-dialog.cta.learn-more': 'Learn more.',
  /** Toast error message when we dont have a resolved Sanity Create url*/
  'start-in-create-dialog.error-toast.unresolved-url': 'Unable to determine Sanity Create URL.',

  /** Header of the "Linking in progress" dialog */
  'linking-in-progress-dialog.header': 'Linking to Sanity Create',
  /** Lede text for the "Linking in progress" dialog */
  'linking-in-progress-dialog.lede':
    'Head back to Sanity Create. Your document will sync automatically (usually takes a few seconds).',
  /** Details for the "Linking in progress" dialog */
  'linking-in-progress-dialog.details': 'Once linked, your edits will appear here in real-time.',
  /** "Linking in progress" troubleshooting button title */
  'linking-in-progress-dialog.troubleshooting.button.title': 'Linking delayed?',
  /** "Linking in progress" troubleshooting content */
  'linking-in-progress-dialog.troubleshooting.content':
    'Check if your Sanity Create window is still open, or if the process seems stuck. If problems persist, try refreshing the Studio and try again.',
  /** Text for the document pane banner informing users that the document is linked to Sanity Create */
  'studio-create-link-banner.text': 'This document is linked to Sanity Create',

  /** Tooltip for Create Link button */
  'create-link-info.tooltip': 'Learn more',
  /** Text above header in Create Link info popover */
  'create-link-info-popover.eyebrow-title': 'Sanity Create',
  /** Text in badge above header in Create Link info popover */
  'create-link-info-popover.eyebrow-badge': 'Early access',
  /** Header in Create Link info popover */
  'create-link-info-popover.header': 'Idea-first authoring',
  /** Informational text in Create Link info popover */
  'create-link-info-popover.text':
    'Write naturally in an AI-powered editor. Your content automatically maps to Studio fields as you type.',

  /** Edit in Create button text */
  'edit-in-create-button.text': 'Edit with Sanity Create',
  /** Unlink document from Sanity Create button text */
  'unlink-from-create-button.text': 'Unlink',

  /** Unlink from Create dialog header */
  'unlink-from-create-dialog.header': 'Switch editing to Studio?',
  /** Unlink from Create dialog – first informational paragraph */
  'unlink-from-create-dialog.first-paragraph':
    'You’re unlinking “<strong>{{title}}</strong>” from Sanity Create so it can be edited here.',
  /** Unlink from Create dialog – second informational paragraph */
  'unlink-from-create-dialog.second-paragraph':
    'You’ll keep your content in both places. Any new changes in Sanity Create will stop syncing to this Studio.',
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
