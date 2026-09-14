import {Flex, Text} from '@sanity/ui'

import {useDocumentLastEditedBy} from '../../store/translog/useDocumentLastEditedBy'
import {useUser} from '../../store/user/hooks'
import {AvatarSkeleton, UserAvatar} from '../userAvatar/UserAvatar'
import {cellRoot, nameText} from './EditedByCell.css'

/**
 * Presentation for an "Edited by" cell: the avatar + display name of a resolved editor id. A
 * person-named column (not just an avatar) is what distinguishes authorship from live presence — the
 * two used to read as the same round avatar. Collapses to avatar-only when the column is too narrow
 * to fit the name. Shared by the Releases and Variant document tables, each of which resolves the
 * editor id through its own history source.
 *
 * @internal
 */
export function EditedByAvatar({
  userId,
  loading,
}: {
  userId: string | undefined
  loading: boolean
}): React.JSX.Element | null {
  const [user] = useUser(userId ?? '')

  if (loading) {
    return <AvatarSkeleton $size={0} animated />
  }

  if (!userId) {
    return null
  }

  return (
    <Flex align="center" gap={2} className={cellRoot}>
      <UserAvatar size={0} user={userId} withTooltip />
      {user?.displayName && (
        <Text muted size={1} textOverflow="ellipsis" className={nameText}>
          {user.displayName}
        </Text>
      )}
    </Flex>
  )
}

/**
 * "Edited by" cell for the variant document table: resolves the last editor from the document's
 * transaction log, then renders {@link EditedByAvatar}.
 *
 * @internal
 */
export function EditedByCell({
  documentId,
  revision,
}: {
  documentId: string | undefined
  revision?: string
}): React.JSX.Element | null {
  const {lastEditedBy, loading} = useDocumentLastEditedBy(documentId, revision)

  return <EditedByAvatar loading={loading} userId={lastEditedBy} />
}
