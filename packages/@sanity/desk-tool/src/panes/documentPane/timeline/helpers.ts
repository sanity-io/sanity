import {Chunk, ChunkType} from '@sanity/field/diff'
import CloseIcon from 'part:@sanity/base/close-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import PlusIcon from 'part:@sanity/base/plus-icon'
import PublishIcon from 'part:@sanity/base/publish-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import UnpublishIcon from 'part:@sanity/base/unpublish-icon'

const LABELS: {[key: string]: string} = {
  create: 'created',
  delete: 'deleted',
  discardDraft: 'discarded draft',
  initial: 'created',
  editDraft: 'edited',
  publish: 'published',
  unpublish: 'unpublished',
}

const ICON_COMPONENTS: {[key: string]: React.ComponentType<Record<string, unknown>>} = {
  create: PlusIcon,
  delete: TrashIcon,
  discardDraft: CloseIcon,
  initial: PlusIcon,
  editDraft: EditIcon,
  publish: PublishIcon,
  unpublish: UnpublishIcon,
}

export function formatTimelineEventLabel(type: ChunkType) {
  return LABELS[type]
}

export function getTimelineEventIconComponent(type: ChunkType) {
  return ICON_COMPONENTS[type]
}

export function sinceTimelineProps(since: Chunk, rev: Chunk) {
  return {
    topSelection: rev,
    bottomSelection: since,
    disabledBeforeSelection: true,
  }
}

export function revTimelineProps(rev: Chunk) {
  return {
    topSelection: rev,
    bottomSelection: rev,
  }
}
