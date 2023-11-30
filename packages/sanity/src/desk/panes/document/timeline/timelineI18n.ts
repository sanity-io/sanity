import type {ChunkType, StudioLocaleResourceKeys} from 'sanity'

/**
 * Maps from a chunk type to an i18n key for the operation
 *
 * @internal
 */
export const TIMELINE_ITEM_I18N_KEY_MAPPING: Record<ChunkType, StudioLocaleResourceKeys> = {
  initial: 'timeline.operation.created-initial',
  create: 'timeline.operation.created',
  publish: 'timeline.operation.published',
  editLive: 'timeline.operation.edited-live',
  editDraft: 'timeline.operation.edited-draft',
  unpublish: 'timeline.operation.unpublished',
  discardDraft: 'timeline.operation.draft-discarded',
  delete: 'timeline.operation.deleted',
}
