import {useEffect} from 'react'
import {
  useDocumentPresence,
  usePresenceStore,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {FieldPresenceInner} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2'
import {Box} from 'ui5'

const EMPTY_PATH: [] = []

// `FieldPresenceInner` positions its avatars absolutely, overlapping leftwards from its right
// edge, so the box reserves the stack's width: at most 3 avatars of 25px, overlapping by 4px. Their
// `z-index` (up to 100) is isolated in the box so they stay below the sidebar overlays
const MAX_AVATARS = 3
function avatarStackWidth(count: number): number {
  return 4 + 21 * Math.min(count, MAX_AVATARS)
}

/**
 * Who else has a shared query open, shown like the presence next to a document's title in the
 * Structure tool. Mounted only while the tab is visible and linked to a shared query, so the
 * user is present on its document for as long as this is mounted.
 */
export function SharedQueryPresence({documentId}: {documentId: string}) {
  const presenceStore = usePresenceStore()
  const presence = useDocumentPresence(documentId)

  useEffect(() => {
    presenceStore.setLocation([
      {type: 'document', documentId, path: EMPTY_PATH, lastActiveAt: new Date().toISOString()},
    ])
    return () => presenceStore.setLocation([])
  }, [documentId, presenceStore])

  const userCount = new Set(presence.map((item) => item.user.id)).size
  if (userCount === 0) return null

  return (
    <Box
      data-testid="vision-shared-query-presence"
      flexShrink={0}
      style={{isolation: 'isolate', width: avatarStackWidth(userCount)}}
    >
      <FieldPresenceInner maxAvatars={MAX_AVATARS} presence={presence} stack />
    </Box>
  )
}
