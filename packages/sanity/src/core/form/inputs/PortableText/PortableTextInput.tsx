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
  useImperativeHandle,
  createRef,
  ReactNode,
  startTransition,
} from 'react'
import {Subject} from 'rxjs'
import {Box, useToast} from '@sanity/ui'
import {pathFor} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {SANITY_PATCH_TYPE} from '../../patch'
import {ArrayOfObjectsItemMember, ObjectFormNode} from '../../store'
import type {PortableTextInputProps} from '../../types'
import {EMPTY_ARRAY} from '../../../util'
import {pathToString} from '../../../field'
import {isMemberArrayOfObjects} from '../../members/object/fields/asserters'
import {FormInput} from '../../components'
import {FIXME} from '../../../FIXME'
import {Compositor, PortableTextEditorElement} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {usePatches} from './usePatches'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'
import {isArrayOfObjectsFieldMember, isBlockType} from './_helpers'

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
    editorRef = createRef<PortableTextEditor>(),
    elementProps,
    fullscreen: fullscreenProp,
    hotkeys,
    markers = EMPTY_ARRAY,
    members,
    onChange,
    onEditorChange,
    onCopy,
    onInsert,
    onItemRemove,
    onPaste,
    onPathFocus,
    path,
    readOnly,
    rangeDecorations,
    renderAnnotation,
    renderBlock,
    renderBlockActions,
    renderCustomMarkers,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
    value,
  } = props

  const {onBlur} = elementProps

  // This handle will allow for natively calling .focus
  // on the element and have the PortableTextEditor focused.
  useImperativeHandle(elementProps.ref, () => ({
    focus() {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    },
  }))

  const {subscribe} = usePatches({path})
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(fullscreenProp || false)
  const [isActive, setIsActive] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)

  const toast = useToast()
  const portableTextMemberItemsRef: React.MutableRefObject<PortableTextMemberItem[]> = useRef([])

  // Memoized patch stream
  const patchSubject: Subject<{
    patches: EditorPatch[]
    snapshot: PortableTextBlock[] | undefined
  }> = useMemo(() => new Subject(), [])
  const patches$ = useMemo(() => patchSubject.asObservable(), [patchSubject])

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (fullscreenProp !== undefined) {
      setIsFullscreen(fullscreenProp)
    }
  }, [fullscreenProp])

  const handleToggleFullscreen = useCallback(() => {
    if (editorRef.current) {
      setIsFullscreen((v) => (fullscreenProp === undefined ? !v : fullscreenProp))
    }
  }, [editorRef, fullscreenProp])

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

  // Populate the portableTextMembers Map
  const portableTextMemberItems: PortableTextMemberItem[] = useMemo(() => {
    const result: {
      kind: PortableTextMemberItem['kind']
      member: ArrayOfObjectsItemMember
      node: ObjectFormNode
    }[] = []

    for (const member of members) {
      if (member.kind === 'item') {
        const isObjectBlock = !isBlockType(member.item.schemaType)
        if (isObjectBlock) {
          result.push({kind: 'objectBlock', member, node: member.item})
        } else {
          // Also include regular text blocks with validation, presence or changes.
          if (
            member.item.validation.length > 0 ||
            member.item.changed ||
            member.item.presence?.length
          ) {
            result.push({kind: 'textBlock', member, node: member.item})
          }
          // Inline objects
          const childrenField = member.item.members.find(
            (f) => f.kind === 'field' && f.name === 'children',
          )
          if (
            childrenField &&
            childrenField.kind === 'field' &&
            isMemberArrayOfObjects(childrenField)
          ) {
            // eslint-disable-next-line max-depth
            for (const child of childrenField.field.members) {
              // eslint-disable-next-line max-depth
              if (child.kind === 'item' && child.item.schemaType.name !== 'span') {
                result.push({kind: 'inlineObject', member: child, node: child.item})
              }
            }
          }
          // Markdefs
          const markDefArrayMember = member.item.members
            .filter(isArrayOfObjectsFieldMember)
            .find((f) => f.name === 'markDefs')
          if (markDefArrayMember) {
            // eslint-disable-next-line max-depth
            for (const child of markDefArrayMember.field.members) {
              // eslint-disable-next-line max-depth
              if (child.kind === 'item' && child.item.schemaType.jsonType === 'object') {
                result.push({
                  kind: 'annotation',
                  member: child,
                  node: child.item,
                })
              }
            }
          }
        }
      }
    }

    const items: PortableTextMemberItem[] = result.map((item) => {
      const key = pathToString(item.node.path)
      const existingItem = portableTextMemberItemsRef.current.find((ref) => ref.key === key)
      const isObject = item.kind !== 'textBlock'
      let input: ReactNode

      if (isObject && (!existingItem || !isEqual(item.member, existingItem?.member))) {
        const inputProps = {
          absolutePath: pathFor(item.node.path),
          includeField: false,
          members,
          path: pathFor(path),
          renderAnnotation,
          renderBlock,
          renderField,
          renderInlineBlock,
          renderInput,
          renderItem,
          renderPreview,
          schemaType,
        }
        input = <FormInput {...(inputProps as FIXME)} />
      }

      if (existingItem) {
        existingItem.member = item.member
        existingItem.node = item.node
        existingItem.input = input || existingItem.input
        return existingItem
      }

      return {
        kind: item.kind,
        key,
        member: item.member,
        node: item.node,
        elementRef: createRef<PortableTextEditorElement | null>(),
        input,
      }
    })

    portableTextMemberItemsRef.current = items

    return items
  }, [
    members,
    path,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
  ])

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
    [editorRef, onBlur, onChange, onEditorChange, onPathFocus, toast],
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
    <Box ref={innerElementRef}>
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
