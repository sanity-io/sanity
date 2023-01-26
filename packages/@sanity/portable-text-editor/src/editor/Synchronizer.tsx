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
import {EditorChange, EditorChanges, EditorSelection, PatchObservable} from '../types/editor'
import {Patch} from '../types/patch'
import {FLUSH_PATCHES_DEBOUNCE_MS} from '../constants'
import {debugWithName} from '../utils/debug'
import {PortableTextEditor} from './PortableTextEditor'
import {PortableTextEditorSelectionContext} from './hooks/usePortableTextEditorSelection'
import {PortableTextEditorContext} from './hooks/usePortableTextEditor'
import {PortableTextEditorValueContext} from './hooks/usePortableTextEditorValue'
import {PortableTextEditorReadOnlyContext} from './hooks/usePortableTextReadOnly'
import {useSyncValue} from './hooks/useSyncValue'
import {PortableTextEditorKeyGeneratorContext} from './hooks/usePortableTextEditorKeyGenerator'

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
    // Set initial value from props
    debug('Syncing value from props initially')
    change$.next({type: 'value', value})
    // Unmount
    return () => {
      onFlushPatches()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // No deps, only initially

  useEffect(() => {
    debug('Value from props changed, syncing new value')
    change$.next({type: 'value', value})
  }, [change$, isPending, isControlledComponent, syncValue, value])

  // Flush pending patches
  const onFlushPatches = useCallback(() => {
    debug('Flushing pending patches')
    if (pendingPatches.current.length > 0) {
      onChange({type: 'mutation', patches: pendingPatches.current})
      pendingPatches.current = []
      isPending.current = false
    }
  }, [onChange, isPending])

  // Debounced version of flush pending patches
  const onFlushPatchesDebounced = useMemo(
    () =>
      debounce(onFlushPatches, FLUSH_PATCHES_DEBOUNCE_MS, {
        leading: false,
        trailing: true,
      }),
    [onFlushPatches]
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
          onFlushPatchesDebounced()
          break
        case 'selection':
          debug('Setting selection')
          // Doesn't need to be prioritized, use startTransition
          startTransition(() => {
            setSelection(next.selection)
          })
          onChange(next)
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
  }, [change$, onFlushPatchesDebounced, onChange, syncValue, isPending])

  // Assign context values
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
