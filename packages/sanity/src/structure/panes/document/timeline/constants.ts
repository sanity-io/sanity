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

import {type DocumentVersionEventType} from '../../../../core/store/events/types'
import {type ButtonProps} from '../../../../ui-components'

export const TIMELINE_ICON_COMPONENTS: Record<DocumentVersionEventType, IconComponent> = {
  'document.createVersion': AddCircleIcon,
  'document.createLive': AddCircleIcon,
  'document.deleteGroup': TrashIcon,
  'document.deleteVersion': CloseIcon,
  'document.editVersion': EditIcon,
  'document.updateLive': EditIcon,
  'document.publishVersion': PublishIcon,
  'document.unpublish': UnpublishIcon,
  'document.scheduleVersion': CalendarIcon,
  'document.unscheduleVersion': CircleIcon,
}

export const TIMELINE_ITEM_EVENT_TONE: Record<DocumentVersionEventType, ButtonProps['tone']> = {
  'document.createVersion': 'primary',
  'document.publishVersion': 'positive',
  'document.createLive': 'caution',
  'document.updateLive': 'caution',
  'document.editVersion': 'caution',
  'document.unpublish': 'critical',
  'document.deleteVersion': 'critical',
  'document.deleteGroup': 'critical',
  'document.scheduleVersion': 'caution',
  'document.unscheduleVersion': 'caution',
}
