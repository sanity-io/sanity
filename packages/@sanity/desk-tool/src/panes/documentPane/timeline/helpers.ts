import {ChunkType} from '@sanity/field/diff'
import {format, isToday, isYesterday, differenceInHours, differenceInMinutes} from 'date-fns'
import CloseIcon from 'part:@sanity/base/close-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import PlusIcon from 'part:@sanity/base/plus-icon'
import PublishIcon from 'part:@sanity/base/publish-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import UnpublishIcon from 'part:@sanity/base/unpublish-icon'

const LABELS: {[key: string]: string} = {
  create: 'Created',
  delete: 'Deleted',
  discardDraft: 'Discarded draft',
  initial: 'Created',
  editDraft: 'Edited',
  publish: 'Published',
  unpublish: 'Unpublished'
}

const ICON_COMPONENTS: {[key: string]: React.ComponentType<{}>} = {
  create: PlusIcon,
  delete: TrashIcon,
  discardDraft: CloseIcon,
  initial: PlusIcon,
  editDraft: EditIcon,
  publish: PublishIcon,
  unpublish: UnpublishIcon
}

export function formatHoursAgo(date: Date) {
  const now = Date.now()
  const h = differenceInHours(now, date)

  if (h) {
    return `${h}h`
  }

  const m = differenceInMinutes(now, date)

  if (m) {
    return `${m}m`
  }

  return 'Just now'
}

export function formatTimelineEventDate(date: Date) {
  if (isToday(date)) {
    return formatHoursAgo(date)
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mma')}`
  }

  return format(date, 'MMM D, YYYY')
}

export function formatTimelineEventLabel(type: ChunkType) {
  return LABELS[type]
}

export function getTimelineEventIconComponent(type: ChunkType) {
  return ICON_COMPONENTS[type]
}
