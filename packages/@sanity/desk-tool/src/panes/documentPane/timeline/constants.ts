import {
  TrashIcon,
  EditIcon,
  IconComponent,
  PublishIcon,
  UnpublishIcon,
  CloseIcon,
  AddCircleIcon,
} from '@sanity/icons'

export const TIMELINE_LABELS: {[key: string]: string | undefined} = {
  create: 'created',
  delete: 'deleted',
  discardDraft: 'discarded draft',
  initial: 'created',
  editDraft: 'edited',
  editLive: 'live edited',
  publish: 'published',
  unpublish: 'unpublished',
}

export const TIMELINE_ICON_COMPONENTS: {[key: string]: IconComponent | undefined} = {
  create: AddCircleIcon,
  delete: TrashIcon,
  discardDraft: CloseIcon,
  initial: AddCircleIcon,
  editDraft: EditIcon,
  editLive: EditIcon,
  publish: PublishIcon,
  unpublish: UnpublishIcon,
}
