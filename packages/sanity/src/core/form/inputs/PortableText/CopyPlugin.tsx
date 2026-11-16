import {defineBehavior} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {useEffect, useMemo, useRef} from 'react'

import {type OnCopyFn} from '../../types/inputProps'
import {createClipboardEventLike} from './eventLike'

export function CopyPlugin(props: {onCopy?: OnCopyFn}) {
  const {onCopy} = props
  // Read the callbacks through a ref so a new callback never registers the Behavior again.
  // A new registration would run after the other plugins.
  // This ref contains props only, never a browser or Behavior event.
  const onCopyRef = useRef(onCopy)
  useEffect(() => {
    onCopyRef.current = onCopy
  }, [onCopy])
  const behaviors = useMemo(
    () => [
      // oxlint-disable-next-line react/refs -- defineBehavior stores this guard; the editor calls it outside render
      defineBehavior({
        on: 'clipboard.copy',
        guard: ({event}) => {
          const result = onCopyRef.current?.(
            createClipboardEventLike('copy', event.originEvent.dataTransfer),
          )
          return result !== undefined
        },
        actions: [],
      }),
    ],
    [],
  )

  return <BehaviorPlugin behaviors={behaviors} />
}
