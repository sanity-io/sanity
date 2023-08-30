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
import {useSlate} from 'slate-react'
import {Editor} from 'slate'
import {EditorChange, EditorChanges, EditorSelection} from '../../types/editor'
import {Patch} from '../../types/patch'
import {debugWithName} from '../../utils/debug'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextEditorSelectionContext} from '../hooks/usePortableTextEditorSelection'
import {PortableTextEditorContext} from '../hooks/usePortableTextEditor'
import {PortableTextEditorValueContext} from '../hooks/usePortableTextEditorValue'
import {PortableTextEditorReadOnlyContext} from '../hooks/usePortableTextReadOnly'
import {useSyncValue} from '../hooks/useSyncValue'
import {PortableTextEditorKeyGeneratorContext} from '../hooks/usePortableTextEditorKeyGenerator'
import {IS_PROCESSING_LOCAL_CHANGES} from '../../utils/weakMaps'

const debug = debugWithName('component:PortableTextEditor:Synchronizer')
const debugVerbose = debug.enabled && false

// The editor will commit changes in a throttled fashion in order
// not to overload the network and degrade performance while typing.
const FLUSH_PATCHES_THROTTLED_MS = 500

/**
 * @internal
 */
export interface SynchronizerProps extends PropsWithChildren {
  change$: EditorChanges
  portableTextEditor: PortableTextEditor
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
  const {change$, portableTextEditor, onChange, keyGenerator, readOnly, value} = props
  const [selection, setSelection] = useState<EditorSelection>(null)
  const pendingPatches = useRef<Patch[]>([])

  const syncValue = useSyncValue({
    keyGenerator,
    onChange,
    portableTextEditor,
    readOnly,
  })

  const slateEditor = useSlate()

  useEffect(() => {
    IS_PROCESSING_LOCAL_CHANGES.set(slateEditor, false)
  }, [slateEditor])

  const onFlushPendingPatches = useCallback(() => {
    if (pendingPatches.current.length > 0) {
      debug('Flushing pending patches')
      if (debugVerbose) {
        debug(`Patches:\n${JSON.stringify(pendingPatches.current, null, 2)}`)
      }
      const snapshot = PortableTextEditor.getValue(portableTextEditor)
      onChange({type: 'mutation', patches: pendingPatches.current, snapshot})
      pendingPatches.current = []
    }
    IS_PROCESSING_LOCAL_CHANGES.set(slateEditor, false)
  }, [slateEditor, portableTextEditor, onChange])

  const flush = useCallback(
    (flushFn: () => void) => {
      // If the editor is normalizing (each operation) it means that it's not in the middle of a bigger transform,
      // wait until we buffer up the whole set of patches for the transformation.
      if (Editor.isNormalizing(slateEditor)) {
        onFlushPendingPatches()
        return
      }
      // If it's not normalizing, it's probably in the middle of something. Retry until normalizing again.
      flushFn()
    },
    [onFlushPendingPatches, slateEditor],
  )

  const onFlushPendingPatchesThrottled = useMemo(() => {
    return throttle(
      () => {
        flush(onFlushPendingPatchesThrottled)
      },
      FLUSH_PATCHES_THROTTLED_MS,
      {
        leading: false,
        trailing: true,
      },
    )
  }, [flush])

  // Flush pending patches immediately on unmount
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
          IS_PROCESSING_LOCAL_CHANGES.set(slateEditor, true)
          pendingPatches.current.push(next.patch)
          onFlushPendingPatchesThrottled()
          onChange(next)
          break
        case 'selection':
          // Set the selection state in a transition, we don't need the state immediately.
          startTransition(() => {
            if (debugVerbose) debug('Setting selection')
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
  }, [
    change$,
    onChange,
    onFlushPendingPatches,
    onFlushPendingPatchesThrottled,
    slateEditor,
    syncValue,
  ])

  // Sync the value when going online
  const handleOnline = useCallback(() => {
    debug('Editor is online, syncing from props.value')
    change$.next({type: 'connection', value: 'online'})
    syncValue(value)
  }, [change$, syncValue, value])

  const handleOffline = useCallback(() => {
    debug('Editor is offline')
    change$.next({type: 'connection', value: 'offline'})
  }, [change$])

  // Notify about window online and offline status changes
  useEffect(() => {
    if (portableTextEditor.props.patches$) {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }
    return () => {
      if (portableTextEditor.props.patches$) {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  })

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
