import {
  TrashIcon,
  EditIcon,
  IconComponent,
  PublishIcon,
  UnpublishIcon,
  CloseIcon,
  AddCircleIcon,
} from '@sanity/icons'

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
