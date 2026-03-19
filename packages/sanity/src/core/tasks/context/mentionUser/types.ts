import {type SanityDocument} from '@sanity/client'

import type {UserListWithPermissionsHookValue} from '../../../hooks/useUserListWithPermissions'

/**
 * @internal
 */
export interface MentionUserContextValue {
  mentionOptions: UserListWithPermissionsHookValue
  selectedDocument: SanityDocument | null
  setSelectedDocument: (document: SanityDocument | null) => void
}
