import {UserIcon} from '@sanity/icons/User'
import {UsersIcon} from '@sanity/icons/Users'
import {isEqual, startsWith} from '@sanity/util/paths'
import {useEffect, useMemo, useRef} from 'react'
import {usePresenceStore} from 'sanity'
import {
  defineDocumentFieldAction,
  type PresenceLocation,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {usePresenceDebug} from './context'

/**
 * "Fake presence here": opens the user picker for this field. Inside a Portable Text field the
 * user is placed at the cursor: the editor blurs when the field menu opens (which moves the own
 * presence to the document root), so the last own location reported from inside this field is
 * remembered and used instead of the field path.
 */
export const presenceDebugFieldAction = defineDocumentFieldAction({
  name: 'test/presence-debug',
  useAction({documentId: publishedId, path}) {
    const presenceStore = usePresenceStore()
    const {open} = usePresenceDebug()
    const lastLocationInField = useRef<PresenceLocation | null>(null)
    // The form only shows presence reported for the exact document it edits (e.g. `drafts.<id>`),
    // while field actions receive the published id. The own location always carries the edited
    // id, so remember it from there.
    const editedDocumentId = useRef<string | null>(null)

    useEffect(() => {
      const subscription = presenceStore.debug.ownLocation$.subscribe((locations) => {
        if (locations[0]) {
          editedDocumentId.current = locations[0].documentId
        }
        const inField = locations.find(
          (location) => startsWith(path, location.path) && !isEqual(path, location.path),
        )
        if (inField) {
          lastLocationInField.current = inField
          return
        }
        // Focus moved to another field (not just blurred to the root): forget the old cursor
        if (locations.some((location) => location.path.length > 0)) {
          lastLocationInField.current = null
        }
      })
      return () => subscription.unsubscribe()
    }, [path, presenceStore])

    return useMemo(
      () => ({
        type: 'group' as const,
        title: 'Presence',
        icon: UsersIcon,
        renderAsButton: true,
        children: [
          {
            type: 'action' as const,
            icon: UserIcon,
            title: 'Fake presence here',
            onAction() {
              open({
                documentId: editedDocumentId.current ?? publishedId,
                path,
                location: lastLocationInField.current ?? undefined,
              })
            },
          },
          {
            type: 'action' as const,
            icon: UsersIcon,
            title: 'Remove all fake presence',
            onAction() {
              presenceStore.debug.removeFakePresence()
            },
          },
        ],
      }),
      [open, path, presenceStore, publishedId],
    )
  },
})
