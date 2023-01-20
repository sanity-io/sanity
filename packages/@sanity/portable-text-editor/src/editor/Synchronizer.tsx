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
import {concatMap, share, tap} from 'rxjs/operators'
import {useSlate} from '@sanity/slate-react'
import {EditorChange, EditorChanges, EditorSelection, PatchObservable} from '../types/editor'
import {Patch} from '../types/patch'
import {FLUSH_PATCHES_DEBOUNCE_MS} from '../constants'
import {debugWithName} from '../utils/debug'
import {bufferUntil} from '../utils/bufferUntil'
import {PortableTextEditor} from './PortableTextEditor'
import {PortableTextEditorSelectionContext} from './hooks/usePortableTextEditorSelection'
import {PortableTextEditorContext} from './hooks/usePortableTextEditor'
import {PortableTextEditorValueContext} from './hooks/usePortableTextEditorValue'
import {PortableTextEditorReadOnlyContext} from './hooks/usePortableTextReadOnly'
import {useSyncValue} from './hooks/useSyncValue'

const debug = debugWithName('component:PortableTextEditor:Synchronizer')

export interface SynchronizerProps extends PropsWithChildren {
  onChange: (change: EditorChange) => void
  patches$?: PatchObservable
  change$: EditorChanges
  editor: PortableTextEditor
  value: PortableTextBlock[] | undefined
  readOnly: boolean
}

export function Synchronizer(props: SynchronizerProps) {
  const {readOnly, onChange, patches$, change$, editor, value} = props
  const [selection, setSelection] = useState<EditorSelection>(null)
  const pendingPatches = useRef<Patch[]>([])
  const isPending = useRef(false)
  const slateEditor = useSlate()
  const isControlledComponent = readOnly || !patches$
  const syncValue = useSyncValue({
    editor,
    isPending,
    readOnly,
    slateEditor,
  })

  // Buffer patches$ when we are producing local changes
  const bufferedPatches$ = useMemo(() => {
    return patches$
      ?.pipe(
        tap(({patches}: {patches: Patch[]; snapshot: PortableTextBlock[] | undefined}) => {
          // Reset hasPendingLocalPatches when local patches are returned
          if (patches.some((p) => p.origin === 'local')) {
            isPending.current = false
          }
        })
      )
      .pipe(
        bufferUntil(() => !isPending.current),
        concatMap((patches) => {
          return patches
        })
      )
      .pipe(share())
  }, [patches$])

  // Initial work
  useEffect(() => {
    // Set patch observable on the slateEditor.
    slateEditor.patches$ = bufferedPatches$
    debug('Syncing from props initially')
    syncValue(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // No deps, only initially

  // Sync after new value, if used as a controlled component or currently not having pending local changes
  useEffect(() => {
    if (isControlledComponent || !isPending.current) {
      debug('Syncing new value from props')
      syncValue(value)
    }
  }, [syncValue, isControlledComponent, value])

  // Sends pending local patches away
  const flush = useCallback(() => {
    const finalPatches = [...pendingPatches.current]
    debug('Flushing', finalPatches)
    if (finalPatches.length > 0) {
      onChange({type: 'mutation', patches: finalPatches})
      pendingPatches.current = []
    }
  }, [onChange])

  // the flush fn debounced
  const flushDebounced = useMemo(
    () =>
      debounce(flush, FLUSH_PATCHES_DEBOUNCE_MS, {
        leading: false,
        trailing: true,
      }),
    [flush]
  )

  // Call flush when unmounting the component
  useEffect(() => {
    return () => {
      flush()
    }
  }, [flush])

  // Handle changes from the editor
  useEffect(() => {
    debug('Subscribing to changes$')
    const sub = change$.subscribe((next: EditorChange): void => {
      switch (next.type) {
        case 'patch':
          isPending.current = true
          pendingPatches.current.push(next.patch)
          onChange(next)
          flushDebounced()
          break
        case 'selection':
          onChange(next)
          debug('Setting selection')
          startTransition(() => setSelection(next.selection))
          break
        case 'value':
          debug('Syncing value')
          syncValue(next.value)
          break
        default:
          onChange(next)
      }
    })
    return () => {
      debug('Unsubscribing to changes$')
      sub.unsubscribe()
    }
  }, [change$, flushDebounced, onChange, syncValue])

  // Assign context values
  return (
    <PortableTextEditorContext.Provider value={editor}>
      <PortableTextEditorValueContext.Provider value={value}>
        <PortableTextEditorReadOnlyContext.Provider value={readOnly}>
          <PortableTextEditorSelectionContext.Provider value={selection}>
            {props.children}
          </PortableTextEditorSelectionContext.Provider>
        </PortableTextEditorReadOnlyContext.Provider>
      </PortableTextEditorValueContext.Provider>
    </PortableTextEditorContext.Provider>
  )
}
