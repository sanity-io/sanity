import {
  TrashIcon,
  EditIcon,
  IconComponent,
  PublishIcon,
  UnpublishIcon,
  AddIcon,
  CloseIcon,
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
  create: AddIcon,
  delete: TrashIcon,
  discardDraft: CloseIcon,
  initial: AddIcon,
  editDraft: EditIcon,
  editLive: EditIcon,
  publish: PublishIcon,
  unpublish: UnpublishIcon,
}
