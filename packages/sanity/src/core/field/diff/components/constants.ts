import {
  AddCircleIcon,
  CalendarIcon,
  CircleIcon,
  CloseIcon,
  EditIcon,
  type IconComponent,
  PublishIcon,
  TrashIcon,
  UnpublishIcon,
} from '@sanity/icons'
import {type ThemeColorAvatarColorKey} from '@sanity/ui/theme'

import {type StudioLocaleResourceKeys} from '../../../i18n/bundles/studio'
import {type DocumentVersionEventType} from '../../../store/events/types'

export const TIMELINE_ICON_COMPONENTS: Record<DocumentVersionEventType, IconComponent> = {
  createDocumentVersion: AddCircleIcon,
  createLiveDocument: AddCircleIcon,
  deleteDocumentGroup: TrashIcon,
  deleteDocumentVersion: CloseIcon,
  editDocumentVersion: EditIcon,
  updateLiveDocument: EditIcon,
  publishDocumentVersion: PublishIcon,
  unpublishDocument: UnpublishIcon,
  scheduleDocumentVersion: CalendarIcon,
  unscheduleDocumentVersion: CircleIcon,
}

export const TIMELINE_ITEM_EVENT_TONE: Record<DocumentVersionEventType, ThemeColorAvatarColorKey> =
  {
    createDocumentVersion: 'green',
    createLiveDocument: 'blue',
    updateLiveDocument: 'green',
    editDocumentVersion: 'yellow',
    unpublishDocument: 'orange',
    deleteDocumentVersion: 'orange',
    deleteDocumentGroup: 'orange',
    scheduleDocumentVersion: 'cyan',
    unscheduleDocumentVersion: 'cyan',
    publishDocumentVersion: 'green',
  }

/**
 * @internal
 * mapping of events types with a readable key for translation
 */
export const TIMELINE_ITEM_I18N_KEY_MAPPING: Record<
  DocumentVersionEventType,
  StudioLocaleResourceKeys
> = {
  createDocumentVersion: 'timeline.operation.created',
  publishDocumentVersion: 'timeline.operation.published',
  updateLiveDocument: 'timeline.operation.edited-live',
  editDocumentVersion: 'timeline.operation.edited-draft',
  unpublishDocument: 'timeline.operation.unpublished',
  deleteDocumentVersion: 'timeline.operation.draft-discarded',
  deleteDocumentGroup: 'timeline.operation.deleted',
  scheduleDocumentVersion: 'timeline.operation.published',
  unscheduleDocumentVersion: 'timeline.operation.published',
  createLiveDocument: 'timeline.operation.created',
}
