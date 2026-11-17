import {useEditor} from '@portabletext/editor'
import {defineBehavior, effect, forward, raise} from '@portabletext/editor/behaviors'
import {useEffect} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {type OnPasteFn} from '../../types/inputProps'
import {usePortableTextMemberSchemaTypes} from './contexts/PortableTextMemberSchemaTypes'
import {createClipboardEventLike} from './eventLike'

export function PastePlugin(props: {onPaste?: OnPasteFn}) {
  const {onPaste} = props
  const editor = useEditor()
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const handlePaste = useEffectEvent((input: Omit<Parameters<OnPasteFn>[0], 'schemaTypes'>) =>
    onPaste?.({...input, schemaTypes}),
  )
  // Keyed on the editor only: registering again would put this Behavior after the other plugins.
  useEffect(() => {
    // Skip the handler when an asynchronous paste resumes the editor's default path.
    const fallbackPastes = new WeakSet<DataTransfer>()
    const unregister = editor.registerBehavior({
      behavior: defineBehavior({
        on: 'clipboard.paste',
        guard: ({snapshot, event}) => {
          const dataTransfer = event.originEvent.dataTransfer
          if (fallbackPastes.has(dataTransfer)) {
            return false
          }
          const result = handlePaste({
            path: snapshot.context.selection?.focus.path ?? [],
            value: snapshot.context.value,
            event: createClipboardEventLike('paste', dataTransfer),
          })
          return result ? {result} : false
        },
        actions: [
          ({event}, {result}) => {
            if (!('then' in result)) {
              return result.insert
                ? [raise({type: 'insert.blocks', blocks: result.insert, placement: 'auto'})]
                : [forward(event)]
            }
            return [
              effect(async ({send}) => {
                let resolved
                try {
                  resolved = await result
                } catch (error) {
                  console.warn(error)
                  return
                }
                if (resolved?.insert) {
                  send({type: 'insert.blocks', blocks: resolved.insert, placement: 'auto'})
                  return
                }
                const selection = editor.getSnapshot().context.selection
                if (!selection) {
                  console.warn('Could not find position for paste event')
                  return
                }
                fallbackPastes.add(event.originEvent.dataTransfer)
                send({...event, position: {selection}})
              }),
            ]
          },
        ],
      }),
    })
    return unregister
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [editor])

  return null
}
