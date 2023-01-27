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
import {EditorChange, EditorChanges, EditorSelection, PatchObservable} from '../../types/editor'
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

export interface SynchronizerProps extends PropsWithChildren {
  change$: EditorChanges
  editor: PortableTextEditor
  isPending: React.MutableRefObject<boolean | null>
  keyGenerator: () => string
  onChange: (change: EditorChange) => void
  patches$?: PatchObservable
  readOnly: boolean
  value: PortableTextBlock[] | undefined
}

export function Synchronizer(props: SynchronizerProps) {
  const {change$, editor, isPending, onChange, keyGenerator, patches$, readOnly, value} = props
  const [selection, setSelection] = useState<EditorSelection>(null)
  const isControlledComponent = readOnly || !patches$
  const pendingPatches = useRef<Patch[]>([])
  const slateEditor = useSlate()

  const syncValue = useSyncValue({
    editor,
    keyGenerator,
    isPending,
    readOnly,
    slateEditor,
  })

  // On mount
  useEffect(() => {
    // Sync initial value from props
    debug('Syncing value from props initially')
    change$.next({type: 'value', value})
    // Unmount
    return () => {
      onFlushPendingPatches()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // No deps, only initially

  useEffect(() => {
    debug('Value from props changed, syncing new value')
    change$.next({type: 'value', value})
  }, [change$, isPending, isControlledComponent, syncValue, value])

  const onFlushPendingPatches = useCallback(() => {
    debug('Flushing pending patches')
    const finalPatches = [...pendingPatches.current]
    if (finalPatches.length > 0) {
      onChange({type: 'mutation', patches: pendingPatches.current})
      pendingPatches.current = pendingPatches.current.splice(
        finalPatches.length,
        pendingPatches.current.length
      )
      isPending.current = false
    }
  }, [onChange, isPending])

  // Debounced version of flush pending patches
  const onFlushPendingPatchesDebounced = useMemo(
    () =>
      debounce(onFlushPendingPatches, FLUSH_PATCHES_DEBOUNCE_MS, {
        leading: false,
        trailing: true,
      }),
    [onFlushPendingPatches]
  )

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
          // Set the selection state in a transition, we don't need it immediately.
          startTransition(() => {
            debug('Setting selection')
            setSelection(next.selection)
          })
          onChange(next) // Keep this out of the startTransition!
          break
        case 'value':
          debug('Syncing value')
          syncValue(next.value)
          onChange(next)
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
