import {
  type RangeDecoration,
  type RangeDecorationOnMovedDetails,
} from '@sanity/portable-text-editor'
import {type Path} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useRef, useState} from 'react'
import {EMPTY_ARRAY} from 'sanity'

import {type FormNodePresence} from '../../../../presence'
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
  const [currentPresence, setCurrentPresence] = useState<FormNodePresence[]>([])
  const [presenceCursorDecorations, setPresenceCursorDecorations] = useState<RangeDecoration[]>([])
  const previousPresence = useRef(currentPresence)
  const handleRangeDecorationMoved = useCallback((details: RangeDecorationOnMovedDetails) => {
    const {rangeDecoration, newSelection} = details
    // Update the range decoration with the new selection.
    setPresenceCursorDecorations((prev) => {
      // eslint-disable-next-line max-nested-callbacks
      const next = prev.map((p) => {
        if (p.payload?.sessionId === rangeDecoration.payload?.sessionId) {
          const nextDecoration: RangeDecoration = {
            ...rangeDecoration,
            selection: newSelection,
          }
          return nextDecoration
        }
        return p
      })
      return next
    })
  }, [])

  useEffect(() => {
    const result = fieldPresence.filter((p) => startsWith(path, p.path) && !isEqual(path, p.path))
    // Test is the selection and sessionId are the same as last time, if it is we don't need to update
    if (
      !isEqual(
        result.map((d) => ({...d.selection, sessionId: d.sessionId})),
        previousPresence.current.map((d) => ({...d.selection, sessionId: d.sessionId})),
      )
    ) {
      const value = result.length > 0 ? result : EMPTY_ARRAY
      setCurrentPresence(value)
      previousPresence.current = value
    }
  }, [fieldPresence, path])

  useEffect(() => {
    const decorations: RangeDecoration[] = currentPresence.map((presence) => {
      if (!presence.selection) {
        return null
      }
      // Create a cursor point at the current selection focus
      const cursorPoint = {focus: presence.selection.focus, anchor: presence.selection.focus}
      return {
        component: () => <UserPresenceCursor user={presence.user} />,
        selection: cursorPoint,
        onMoved: handleRangeDecorationMoved,
        payload: {sessionId: presence.sessionId},
      }
    }) as RangeDecoration[]
    setPresenceCursorDecorations(decorations.filter(Boolean))
  }, [currentPresence, handleRangeDecorationMoved])

  return presenceCursorDecorations
}
