import {type IconComponent} from '@sanity/icons'
import {AddIcon} from '@sanity/icons/Add'
import {CloseIcon} from '@sanity/icons/Close'
import {EditIcon} from '@sanity/icons/Edit'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'

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
