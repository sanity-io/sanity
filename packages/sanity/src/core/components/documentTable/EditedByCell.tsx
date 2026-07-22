import {Flex, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {useDocumentLastEditedBy} from '../../store/translog/useDocumentLastEditedBy'
import {useUser} from '../../store/user/hooks'
import {AvatarSkeleton, UserAvatar} from '../userAvatar/UserAvatar'

// container-query wrapper: show the editor's name when the cell has room, collapse to just the
// avatar when the column is squeezed narrow. The avatar always carries the name in its tooltip, so
// nothing is lost when the label is hidden.
const CellRoot = styled(Flex)`
  container-type: inline-size;
  min-width: 0;
`
const NameText = styled(Text)`
  min-width: 0;
  @container (max-width: 108px) {
    display: none;
  }
`

/**
 * "Edited by" table cell: the avatar + display name of whoever last edited the document, resolved
 * from the transaction log. A person-named column (not just an avatar) is what distinguishes
 * authorship from live presence — the two used to read as the same round avatar. Collapses to
 * avatar-only when the column is too narrow to fit the name.
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
  const [user] = useUser(lastEditedBy ?? '')

  if (loading) {
    return <AvatarSkeleton $size={0} animated />
  }

  if (!lastEditedBy) {
    return null
  }

  return (
    <CellRoot align="center" gap={2}>
      <UserAvatar size={0} user={lastEditedBy} withTooltip />
      {user?.displayName && (
        <NameText muted size={1} textOverflow="ellipsis">
          {user.displayName}
        </NameText>
      )}
    </CellRoot>
  )
}
