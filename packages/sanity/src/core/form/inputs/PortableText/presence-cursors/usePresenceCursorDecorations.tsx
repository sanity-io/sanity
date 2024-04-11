import {type RangeDecoration} from '@sanity/portable-text-editor'
import {type Path} from '@sanity/types'
import {isEqual} from 'lodash'
import {useMemo} from 'react'

import {useChildPresence} from '../../../studio/contexts/Presence'
import {UserPresenceCursor} from './UserPresenceCursor'

export interface PresenceCursorDecorationsHookProps {
  boundaryElement: HTMLElement | null
  path: Path
}

export function usePresenceCursorDecorations(
  props: PresenceCursorDecorationsHookProps,
): RangeDecoration[] {
  const {boundaryElement, path} = props
  const childPresence = useChildPresence(path)

  return useMemo((): RangeDecoration[] => {
    const decorations: RangeDecoration[] = childPresence
      .filter((presence) => Boolean(presence?.selection))
      .map((presence) => {
        // If the selection is a range, we don't want to render a cursor.
        // This is because this might end up with multiple cursors for the same user.
        const isRange = !isEqual(presence?.selection?.anchor, presence?.selection?.focus)

        if (isRange) return null

        return {
          component: () => (
            <UserPresenceCursor boundaryElement={boundaryElement} user={presence.user} />
          ),
          selection: presence?.selection,
        }
      }) as RangeDecoration[]

    return decorations.filter(Boolean)
  }, [boundaryElement, childPresence])
}
