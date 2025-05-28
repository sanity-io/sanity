import {type RangeDecoration, type RangeDecorationOnMovedDetails} from '@portabletext/editor'
import {type Path} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useRef, useState} from 'react'

import {type FormNodePresence} from '../../../../presence'
import {EMPTY_ARRAY} from '../../../../util/empty'
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
  const previousPresence = useRef<FormNodePresence[]>(currentPresence)

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
    const nextPresence = fieldPresence.filter(
      (p) => startsWith(path, p.path) && !isEqual(path, p.path),
    )

    // Filter out the selection and sessionId from the next and previous presence
    // since that is the only thing we are interested in comparing to see if we need to update.
    const filteredNext = nextPresence.map((d) => ({...d.selection, sessionId: d.sessionId}))
    const filteredPrevious = previousPresence.current.map((d) => ({
      ...d.selection,
      sessionId: d.sessionId,
    }))

    // Only update the current presence state it has changed.
    if (!isEqual(filteredNext, filteredPrevious)) {
      const value = nextPresence.length > 0 ? nextPresence : EMPTY_ARRAY

      setCurrentPresence(value)
      // Store the previous presence to be able to compare it in the next render.
      previousPresence.current = value
    }
  }, [fieldPresence, path])

  useEffect(() => {
    const decorations: RangeDecoration[] = currentPresence.map((presence) => {
      if (!presence.selection) return null

      // Always use the focus point as the cursor point. This is important when
      // the user has selected a range of text. In that case, we want to show the
      // cursor at the start of the selection.
      const cursorPoint = {focus: presence.selection.focus, anchor: presence.selection.focus}

      return {
        component: ({children}) => (
          <UserPresenceCursor user={presence.user}>{children}</UserPresenceCursor>
        ),
        selection: cursorPoint,
        onMoved: handleRangeDecorationMoved,
        payload: {sessionId: presence.sessionId},
      }
    }) as RangeDecoration[]

    setPresenceCursorDecorations(decorations.filter(Boolean))
  }, [currentPresence, handleRangeDecorationMoved])

  return presenceCursorDecorations
}
