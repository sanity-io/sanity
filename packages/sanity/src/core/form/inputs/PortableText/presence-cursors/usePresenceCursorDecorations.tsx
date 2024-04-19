import {type RangeDecoration} from '@sanity/portable-text-editor'
import {type Path} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {useMemo, useRef} from 'react'
import {type FormNodePresence} from 'sanity/index'

import {immutableReconcile} from '../../../store/utils/immutableReconcile'
import {useFormFieldPresence} from '../../../studio/contexts/Presence'
import {UserPresenceCursor} from './UserPresenceCursor'

export interface PresenceCursorDecorationsHookProps {
  path: Path
}

export function usePresenceCursorDecorations(
  props: PresenceCursorDecorationsHookProps,
): RangeDecoration[] {
  const {path} = props
  const fieldPresence = useFormFieldPresence()
  const previousCurrentPresence = useRef<FormNodePresence[]>([])

  const currentPresence = useMemo(
    () => fieldPresence.filter((p) => startsWith(path, p.path) && !isEqual(path, p.path)),
    [fieldPresence, path],
  )
  const reconciled = immutableReconcile(previousCurrentPresence.current, currentPresence)
  previousCurrentPresence.current = reconciled

  return useMemo((): RangeDecoration[] => {
    const decorations: RangeDecoration[] = reconciled.map((presence) => {
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
  }, [reconciled])
}
