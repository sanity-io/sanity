import {type DocumentVersionEventType, type StudioLocaleResourceKeys} from 'sanity'

/**
 * Maps from a chunk type to an i18n key for the operation
 *
 * @internal
 */
export const TIMELINE_ITEM_I18N_KEY_MAPPING: Record<
  DocumentVersionEventType,
  StudioLocaleResourceKeys
> = {
  'document.createVersion': 'timeline.operation.created',
  'document.publishVersion': 'timeline.operation.published',
  'document.updateLive': 'timeline.operation.edited-live',
  'document.editVersion': 'timeline.operation.edited-draft',
  'document.unpublish': 'timeline.operation.unpublished',
  'document.deleteVersion': 'timeline.operation.draft-discarded',
  'document.deleteGroup': 'timeline.operation.deleted',
  'document.scheduleVersion': 'timeline.operation.published',
  'document.unscheduleVersion': 'timeline.operation.published',
  'document.createLive': 'timeline.operation.created',
}
