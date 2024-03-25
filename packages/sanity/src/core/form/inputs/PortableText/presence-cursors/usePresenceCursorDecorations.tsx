import {type RangeDecoration} from '@sanity/portable-text-editor'
import {type Path} from '@sanity/types'
import {isEqual} from 'lodash'
import {useMemo} from 'react'

import {useChildPresence} from '../../../studio/contexts/Presence'
import {UserPresenceCursor} from './UserPresenceCursor'

interface PresenceCursorDecorationsHookProps {
  path: Path
}

export function usePresenceCursorDecorations(props: PresenceCursorDecorationsHookProps) {
  const {path} = props
  const childPresence = useChildPresence(path)

  return useMemo((): RangeDecoration[] => {
    const decorations: RangeDecoration[] = childPresence
      // .filter((presence) => presence.user.id !== currentUser?.id)
      .filter((presence) => presence?.selection)
      .map((presence) => {
        // If the selection is a range, we don't want to render a cursor.
        // This is because this might end up with multiple cursors for the same user.
        const isRange = !isEqual(presence?.selection?.anchor, presence?.selection?.focus)

        if (isRange) return null

        return {
          component: ({children}) => (
            <UserPresenceCursor user={presence.user}>{children}</UserPresenceCursor>
          ),
          selection: presence?.selection,
        }
      }) as RangeDecoration[]

    return decorations.filter(Boolean)
  }, [childPresence])
}
