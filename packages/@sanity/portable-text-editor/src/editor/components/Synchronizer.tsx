import React, {
  PropsWithChildren,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {debounce} from 'lodash'
import {useSlate} from '@sanity/slate-react'
import {EditorChange, EditorChanges, EditorSelection} from '../../types/editor'
import {Patch} from '../../types/patch'
import {FLUSH_PATCHES_DEBOUNCE_MS} from '../../constants'
import {debugWithName} from '../../utils/debug'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextEditorSelectionContext} from '../hooks/usePortableTextEditorSelection'
import {PortableTextEditorContext} from '../hooks/usePortableTextEditor'
import {PortableTextEditorValueContext} from '../hooks/usePortableTextEditorValue'
import {PortableTextEditorReadOnlyContext} from '../hooks/usePortableTextReadOnly'
import {useSyncValue} from '../hooks/useSyncValue'
import {PortableTextEditorKeyGeneratorContext} from '../hooks/usePortableTextEditorKeyGenerator'

const debug = debugWithName('component:PortableTextEditor:Synchronizer')

/**
 * @internal
 */
export interface SynchronizerProps extends PropsWithChildren {
  change$: EditorChanges
  editor: PortableTextEditor
  isPending: React.MutableRefObject<boolean | null>
  keyGenerator: () => string
  onChange: (change: EditorChange) => void
  readOnly: boolean
  value: PortableTextBlock[] | undefined
}

/**
 * Synchronizes the server value and provides contexts with the editor state.
 * @internal
 */
export function Synchronizer(props: SynchronizerProps) {
  const {change$, editor, isPending, onChange, keyGenerator, readOnly, value} = props
  const [selection, setSelection] = useState<EditorSelection>(null)
  const pendingPatches = useRef<Patch[]>([])
  const slateEditor = useSlate()

  const syncValue = useSyncValue({
    editor,
    keyGenerator,
    isPending,
    readOnly,
    slateEditor,
  })

  useEffect(() => {
    startTransition(() => {
      debug('Value from props changed, syncing new value')
      syncValue(value)
    })
    change$.next({type: 'value', value})
  }, [syncValue, change$, value])

  const onFlushPendingPatches = useCallback(() => {
    const finalPatches = [...pendingPatches.current]
    debug('Flushing pending patches', finalPatches)
    if (finalPatches.length > 0) {
      pendingPatches.current = pendingPatches.current.splice(
        finalPatches.length,
        pendingPatches.current.length
      )
      onChange({type: 'mutation', patches: finalPatches})
    }
  }, [onChange])

  // Debounced version of flush pending patches
  const onFlushPendingPatchesDebounced = useMemo(
    () =>
      debounce(onFlushPendingPatches, FLUSH_PATCHES_DEBOUNCE_MS, {
        leading: false,
        trailing: true,
      }),
    [onFlushPendingPatches]
  )

  // Flush pending patches on unmount
  useEffect(() => {
    return () => {
      onFlushPendingPatches()
    }
  }, [onFlushPendingPatches])

  // Subscribe to, and handle changes from the editor
  useEffect(() => {
    debug('Subscribing to editor changes$')
    const sub = change$.subscribe((next: EditorChange): void => {
      switch (next.type) {
        case 'patch':
          isPending.current = true
          pendingPatches.current.push(next.patch)
          onChange(next)
          onFlushPendingPatchesDebounced()
          break
        case 'selection':
          // Set the selection state in a transition, we don't need the state immediately.
          startTransition(() => {
            debug('Setting selection')
            setSelection(next.selection)
          })
          onChange(next) // Keep this out of the startTransition!
          break
        default:
          onChange(next)
      }
    })
    return () => {
      debug('Unsubscribing to changes$')
      sub.unsubscribe()
    }
  }, [change$, onFlushPendingPatchesDebounced, onChange, syncValue, isPending])
  return (
    <PortableTextEditorKeyGeneratorContext.Provider value={keyGenerator}>
      <PortableTextEditorContext.Provider value={editor}>
        <PortableTextEditorValueContext.Provider value={value}>
          <PortableTextEditorReadOnlyContext.Provider value={readOnly}>
            <PortableTextEditorSelectionContext.Provider value={selection}>
              {props.children}
            </PortableTextEditorSelectionContext.Provider>
          </PortableTextEditorReadOnlyContext.Provider>
        </PortableTextEditorValueContext.Provider>
      </PortableTextEditorContext.Provider>
    </PortableTextEditorKeyGeneratorContext.Provider>
  )
}
