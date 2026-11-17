import {useEditor} from '@portabletext/editor'
import {defineBehavior} from '@portabletext/editor/behaviors'
import {useEffect} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {type OnCopyFn} from '../../types/inputProps'
import {createClipboardEventLike} from './eventLike'

export function CopyPlugin(props: {onCopy?: OnCopyFn}) {
  const {onCopy} = props
  const editor = useEditor()
  const handleCopy = useEffectEvent((event: Parameters<OnCopyFn>[0]) => onCopy?.(event))
  // Keyed on the editor only: registering again would put this Behavior after the other plugins.
  useEffect(() => {
    const unregister = editor.registerBehavior({
      behavior: defineBehavior({
        on: 'clipboard.copy',
        guard: ({event}) => {
          const result = handleCopy(
            createClipboardEventLike('copy', event.originEvent.dataTransfer),
          )
          return result !== undefined
        },
        actions: [],
      }),
    })
    return unregister
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [editor])

  return null
}
