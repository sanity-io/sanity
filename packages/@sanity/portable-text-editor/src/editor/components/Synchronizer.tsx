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
import {throttle} from 'lodash'
import {EditorChange, EditorChanges, EditorSelection} from '../../types/editor'
import {Patch} from '../../types/patch'
import {FLUSH_PATCHES_MS} from '../../constants'
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
  portableTextEditor: PortableTextEditor
  isPending: React.MutableRefObject<boolean | null>
  keyGenerator: () => string
  onChange: (change: EditorChange) => void
  readOnly: boolean
  value: PortableTextBlock[] | undefined
}

/**
 * Synchronizes the server value with the editor, and provides various contexts for the editor state.
 * @internal
 */
export function Synchronizer(props: SynchronizerProps) {
  const {change$, portableTextEditor, isPending, onChange, keyGenerator, readOnly, value} = props
  const [selection, setSelection] = useState<EditorSelection>(null)
  const pendingPatches = useRef<Patch[]>([])

  const syncValue = useSyncValue({
    isPending,
    keyGenerator,
    onChange,
    portableTextEditor,
    readOnly,
  })

  const onFlushPendingPatches = useCallback(() => {
    const finalPatches = pendingPatches.current
    debug('Flushing pending patches', finalPatches)
    if (finalPatches.length > 0) {
      pendingPatches.current = []
      const snapshot = PortableTextEditor.getValue(portableTextEditor)
      onChange({type: 'mutation', patches: finalPatches, snapshot})
    }
    isPending.current = false
  }, [portableTextEditor, isPending, onChange])

  // Debounced version of flush pending patches
  const onFlushPendingPatchesDebounced = useMemo(() => {
    return throttle(onFlushPendingPatches, FLUSH_PATCHES_MS, {
      leading: false,
      trailing: true,
    })
  }, [onFlushPendingPatches])

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
          onFlushPendingPatchesDebounced()
          onChange(next)
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

  // This hook must be set up after setting up the subscription above, or it will not pick up validation errors from the useSyncValue hook.
  // This will cause the editor to not be able to signal a validation error and offer invalid value resolution of the initial value.
  const isInitialValueFromProps = useRef(true)
  useEffect(() => {
    debug('Value from props changed, syncing new value')
    syncValue(value)
    // Signal that we have our first value, and are ready to roll.
    if (isInitialValueFromProps.current) {
      change$.next({type: 'loading', isLoading: false})
      change$.next({type: 'ready'})
      isInitialValueFromProps.current = false
    }
  }, [change$, syncValue, value])

  return (
    <PortableTextEditorKeyGeneratorContext.Provider value={keyGenerator}>
      <PortableTextEditorContext.Provider value={portableTextEditor}>
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
