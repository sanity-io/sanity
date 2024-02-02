import {PortableTextBlock} from '@sanity/types'
import {
  EditorChange,
  Patch as EditorPatch,
  PortableTextEditor,
  InvalidValue,
  Patch,
} from '@sanity/portable-text-editor'
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
  startTransition,
} from 'react'
import {Subject} from 'rxjs'
import {Box, useToast} from '@sanity/ui'
import {useTelemetry} from '@sanity/telemetry/react'
import {SANITY_PATCH_TYPE} from '../../patch'
import {ArrayOfObjectsItemMember, ObjectFormNode} from '../../store'
import type {PortableTextInputProps} from '../../types'
import {EMPTY_ARRAY} from '../../../util'
import {
  PortableTextInputCollapsed,
  PortableTextInputExpanded,
} from '../../__telemetry__/form.telemetry'
import {Compositor, PortableTextEditorElement} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {usePatches} from './usePatches'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'
import {usePortableTextMemberItemsFromProps} from './hooks/usePortableTextMembers'

/** @internal */
export interface PortableTextMemberItem {
  kind: 'annotation' | 'textBlock' | 'objectBlock' | 'inlineObject'
  key: string
  member: ArrayOfObjectsItemMember
  node: ObjectFormNode
  elementRef?: React.MutableRefObject<PortableTextEditorElement | null>
  input?: ReactNode
}

/**
 * Input component for editing block content
 * ({@link https://github.com/portabletext/portabletext | Portable Text}) in the Sanity Studio.
 *
 * Supports multi-user real-time block content editing on larger documents.
 *
 * This component can be configured and customized extensively.
 * {@link https://www.sanity.io/docs/portable-text-features | Go to the documentation for more details}.
 *
 * @public
 * @param props - {@link PortableTextInputProps} component props.
 */
export function PortableTextInput(props: PortableTextInputProps) {
  const {
    editorRef: editorRefProp,
    elementProps,
    hotkeys,
    markers = EMPTY_ARRAY,
    onChange,
    onCopy,
    onEditorChange,
    onFullScreenChange,
    onInsert,
    onItemRemove,
    onPaste,
    onPathFocus,
    path,
    rangeDecorations,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    schemaType,
    value,
  } = props

  const {onBlur, onFocus} = elementProps
  const defaultEditorRef = useRef<PortableTextEditor>()
  const editorRef = editorRefProp || defaultEditorRef

  // TODO: Validate if we need this? It breaks the `ref` object in the `elementProps`.
  //
  // This handle will allow for natively calling .focus
  // on the element and have the PortableTextEditor focused.
  // useImperativeHandle(elementProps.ref, () => ({
  //   focus() {
  //     if (editorRef.current) {
  //       PortableTextEditor.focus(editorRef.current)
  //     }
  //   },
  // }))

  const {subscribe} = usePatches({path})
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const telemetry = useTelemetry()

  const toast = useToast()

  // Memoized patch stream
  const patchSubject: Subject<{
    patches: EditorPatch[]
    snapshot: PortableTextBlock[] | undefined
  }> = useMemo(() => new Subject(), [])
  const patches$ = useMemo(() => patchSubject.asObservable(), [patchSubject])

  const handleToggleFullscreen = useCallback(() => {
    if (editorRef.current) {
      setIsFullscreen((v) => {
        const next = !v
        if (next) {
          telemetry.log(PortableTextInputExpanded)
        } else {
          telemetry.log(PortableTextInputCollapsed)
        }

        onFullScreenChange?.(next)
        return next
      })
    }
  }, [editorRef, onFullScreenChange, telemetry])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Subscribe to patches
  useEffect(() => {
    return subscribe(({patches, snapshot}): void => {
      patchSubject.next({patches, snapshot})
    })
  }, [patchSubject, subscribe])

  const portableTextMemberItems = usePortableTextMemberItemsFromProps(props)

  // Set active if focused within the editor
  useEffect(() => {
    if (hasFocusWithin) {
      setIsActive(true)
    }
  }, [hasFocusWithin])

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          onChange(toFormPatches(change.patches))
          break
        case 'connection':
          if (change.value === 'offline') {
            setIsOffline(true)
          } else if (change.value === 'online') {
            setIsOffline(false)
          }
          break
        case 'selection':
          // This doesn't need to be immediate,
          // call through startTransition
          startTransition(() => {
            if (change.selection) {
              onPathFocus(change.selection.focus.path)
            }
          })
          break
        case 'focus':
          setIsActive(true)
          setHasFocusWithin(true)
          onFocus(change.event)
          break
        case 'blur':
          onBlur(change.event)
          setHasFocusWithin(false)
          break
        case 'undo':
        case 'redo':
          onChange(toFormPatches(change.patches))
          break
        case 'invalidValue':
          setInvalidValue(change)
          break
        case 'error':
          toast.push({
            status: change.level,
            description: change.description,
          })
          break
        default:
      }
      if (editorRef.current && onEditorChange) {
        onEditorChange(change, editorRef.current)
      }
    },
    [editorRef, onBlur, onChange, onEditorChange, onFocus, onPathFocus, toast],
  )

  useEffect(() => {
    setIgnoreValidationError(false)
  }, [value])

  const handleIgnoreInvalidValue = useCallback((): void => {
    setIgnoreValidationError(true)
  }, [])

  const respondToInvalidContent = useMemo(() => {
    if (invalidValue && invalidValue.resolution) {
      return (
        <Box marginBottom={2}>
          <RespondToInvalidContent
            onChange={handleEditorChange}
            onIgnore={handleIgnoreInvalidValue}
            resolution={invalidValue.resolution}
            readOnly={isOffline || readOnly}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreInvalidValue, invalidValue, isOffline, readOnly])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    }
  }, [editorRef, isActive])

  return (
    <Box ref={elementProps.ref}>
      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && (
        <PortableTextMarkersProvider markers={markers}>
          <PortableTextMemberItemsProvider memberItems={portableTextMemberItems}>
            <PortableTextEditor
              ref={editorRef}
              patches$={patches$}
              onChange={handleEditorChange}
              maxBlocks={undefined} // TODO: from schema?
              readOnly={isOffline || readOnly}
              schemaType={schemaType}
              value={value}
            >
              <Compositor
                {...props}
                hasFocusWithin={hasFocusWithin}
                hotkeys={hotkeys}
                isActive={isActive}
                isFullscreen={isFullscreen}
                onActivate={handleActivate}
                onItemRemove={onItemRemove}
                onCopy={onCopy}
                onInsert={onInsert}
                onPaste={onPaste}
                onToggleFullscreen={handleToggleFullscreen}
                rangeDecorations={rangeDecorations}
                renderBlockActions={renderBlockActions}
                renderCustomMarkers={renderCustomMarkers}
              />
            </PortableTextEditor>
          </PortableTextMemberItemsProvider>
        </PortableTextMarkersProvider>
      )}
    </Box>
  )
}

function toFormPatches(patches: any) {
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE}))
}
