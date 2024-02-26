import {type SanityDocument} from '@sanity/client'
import {type UserListWithPermissionsHookValue} from 'sanity'

/**
 * @internal
 */
export interface MentionUserContextValue {
  mentionOptions: UserListWithPermissionsHookValue
  selectedDocument: SanityDocument | null
  setSelectedDocument: (document: SanityDocument | null) => void
}
