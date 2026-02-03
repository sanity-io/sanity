import {type UserListWithPermissionsHookValue} from '../../../hooks'
import {type SanityDocument} from '@sanity/client'

/**
 * @internal
 */
export interface MentionUserContextValue {
  mentionOptions: UserListWithPermissionsHookValue
  selectedDocument: SanityDocument | null
  setSelectedDocument: (document: SanityDocument | null) => void
}
