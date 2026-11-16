import {useEditor} from '@portabletext/editor'
import {defineBehavior, effect, forward, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {useEffect, useMemo, useRef} from 'react'

import {type OnPasteFn} from '../../types/inputProps'
import {usePortableTextMemberSchemaTypes} from './contexts/PortableTextMemberSchemaTypes'
import {createClipboardEventLike} from './eventLike'

export function PastePlugin(props: {onPaste?: OnPasteFn}) {
  const {onPaste} = props
  const editor = useEditor()
  const schemaTypes = usePortableTextMemberSchemaTypes()
  // Read the callbacks through a ref so a new callback never registers the Behavior again.
  // A new registration would run after the other plugins.
  // This ref contains props only, never a browser or Behavior event.
  const handlersRef = useRef({onPaste, schemaTypes})
  useEffect(() => {
    handlersRef.current = {onPaste, schemaTypes}
  }, [onPaste, schemaTypes])
  const behaviors = useMemo(() => {
    // Skip the handler when an asynchronous paste resumes the editor's default path.
    const fallbackPastes = new WeakSet<DataTransfer>()
    return [
      defineBehavior({
        on: 'clipboard.paste',
        guard: ({snapshot, event}) => {
          const dataTransfer = event.originEvent.dataTransfer
          if (fallbackPastes.has(dataTransfer)) {
            return false
          }
          const result = handlersRef.current.onPaste?.({
            path: snapshot.context.selection?.focus.path ?? [],
            value: snapshot.context.value,
            event: createClipboardEventLike('paste', dataTransfer),
            schemaTypes: handlersRef.current.schemaTypes,
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
    ]
  }, [editor])

  return <BehaviorPlugin behaviors={behaviors} />
}
