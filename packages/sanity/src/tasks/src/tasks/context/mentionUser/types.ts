import {type SanityDocument} from '@sanity/client'
import {type UserListWithPermissionsHookValue} from 'sanity'

export interface MentionUserContextValue {
  mentionOptions: UserListWithPermissionsHookValue
  selectedDocument: SanityDocument | null
  setSelectedDocument: (document: SanityDocument | null) => void
}
