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
import {type DocumentVersionEventType, type StudioLocaleResourceKeys} from 'sanity'

export const TIMELINE_ICON_COMPONENTS: Record<DocumentVersionEventType, IconComponent> = {
  CreateDocumentVersion: AddCircleIcon,
  CreateLiveDocument: AddCircleIcon,
  DeleteDocumentGroup: TrashIcon,
  DeleteDocumentVersion: CloseIcon,
  EditDocumentVersion: EditIcon,
  UpdateLiveDocument: EditIcon,
  PublishDocumentVersion: PublishIcon,
  UnpublishDocument: UnpublishIcon,
  ScheduleDocumentVersion: CalendarIcon,
  UnscheduleDocumentVersion: CircleIcon,
}

export const TIMELINE_ITEM_EVENT_TONE: Record<DocumentVersionEventType, ThemeColorAvatarColorKey> =
  {
    CreateDocumentVersion: 'green',
    CreateLiveDocument: 'blue',
    UpdateLiveDocument: 'green',
    EditDocumentVersion: 'yellow',
    UnpublishDocument: 'orange',
    DeleteDocumentVersion: 'orange',
    DeleteDocumentGroup: 'orange',
    ScheduleDocumentVersion: 'cyan',
    UnscheduleDocumentVersion: 'cyan',
    PublishDocumentVersion: 'green',
  }

/**
 * @internal
 * mapping of events types with a readable key for translation
 */
export const TIMELINE_ITEM_I18N_KEY_MAPPING: Record<
  DocumentVersionEventType,
  StudioLocaleResourceKeys
> = {
  CreateDocumentVersion: 'timeline.operation.created',
  PublishDocumentVersion: 'timeline.operation.published',
  UpdateLiveDocument: 'timeline.operation.edited-live',
  EditDocumentVersion: 'timeline.operation.edited-draft',
  UnpublishDocument: 'timeline.operation.unpublished',
  DeleteDocumentVersion: 'timeline.operation.draft-discarded',
  DeleteDocumentGroup: 'timeline.operation.deleted',
  ScheduleDocumentVersion: 'timeline.operation.published',
  UnscheduleDocumentVersion: 'timeline.operation.published',
  CreateLiveDocument: 'timeline.operation.created',
}
