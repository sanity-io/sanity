import {defineLocalesResources} from '../../i18n/helpers'

/**
 * Defined locale strings for the Create integration feature, in US English.
 *
 * @internal
 */
const createLocaleStrings = defineLocalesResources('create', {
  /** CTA in "Start writing in Create" dialog: Learn more */
  'start-in-create-dialog.cta.learn-more': 'Learn more.',
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
