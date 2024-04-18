import {type RangeDecoration} from '@sanity/portable-text-editor'
import {type Path} from '@sanity/types'
import {isEqual, uniqWith} from 'lodash'
import {useMemo} from 'react'

import {useChildPresence} from '../../../studio/contexts/Presence'
import {UserPresenceCursor} from './UserPresenceCursor'

export interface PresenceCursorDecorationsHookProps {
  path: Path
}

export function usePresenceCursorDecorations(
  props: PresenceCursorDecorationsHookProps,
): RangeDecoration[] {
  const {path} = props
  const childPresence = useChildPresence(path)

  return useMemo((): RangeDecoration[] => {
    const decorations: RangeDecoration[] = uniqWith(
      childPresence.filter((presence) => Boolean(presence?.selection)),
      isEqual,
    ).map((presence) => {
      if (!presence.selection) {
        return null
      }
      // Create a cursor point at the current selection focus
      const cursorPoint = {focus: presence.selection.focus, anchor: presence.selection.focus}
      return {
        component: () => <UserPresenceCursor user={presence.user} />,
        selection: cursorPoint,
      }
    }) as RangeDecoration[]

    return decorations.filter(Boolean)
  }, [childPresence])
}
