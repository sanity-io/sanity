import {Flex, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {useDocumentLastEditedBy} from '../../store/translog/useDocumentLastEditedBy'
import {useUser} from '../../store/user/hooks'
import {AvatarSkeleton, UserAvatar} from '../userAvatar/UserAvatar'

// container-query wrapper: show the editor's name when the cell has room, collapse to just the
// avatar when the column is squeezed narrow. The avatar always carries the name in its tooltip, so
// nothing is lost when the label is hidden. `width: 100%` is required: `container-type: inline-size`
// imposes size containment, so without a definite width the element collapses to ~0 (a shrink-to-fit
// flex item derives no intrinsic width once contained) and the query would report "narrow" always.
const CellRoot = styled(Flex)`
  container-type: inline-size;
  width: 100%;
  min-width: 0;
`
const NameText = styled(Text)`
  min-width: 0;
  @container (max-width: 108px) {
    display: none;
  }
`

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
    <CellRoot align="center" gap={2}>
      <UserAvatar size={0} user={userId} withTooltip />
      {user?.displayName && (
        <NameText muted size={1} textOverflow="ellipsis">
          {user.displayName}
        </NameText>
      )}
    </CellRoot>
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
