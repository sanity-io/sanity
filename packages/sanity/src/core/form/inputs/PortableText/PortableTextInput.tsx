import {ArraySchemaType, PortableTextBlock} from '@sanity/types'
import {
  EditorChange,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextEditor,
  HotkeyOptions,
  InvalidValue,
  EditorSelection,
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
} from 'react'
import {Subject} from 'rxjs'
import {Box, useToast} from '@sanity/ui'
import {debounce} from 'lodash'
import {FormPatch, SANITY_PATCH_TYPE} from '../../patch'
import {ArrayOfObjectsItemMember, ObjectFormNode} from '../../store'
import type {ArrayOfObjectsInputProps, PortableTextMarker, RenderCustomMarkers} from '../../types'
import {EMPTY_ARRAY} from '../../../util'
import {pathToString} from '../../../field'
import {isMemberArrayOfObjects} from '../../members/object/fields/asserters'
import {FormInput} from '../../components'
import {FIXME} from '../../../FIXME'
import {Compositor, PortableTextEditorElement} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {usePatches} from './usePatches'
import {RenderBlockActionsCallback} from './types'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'
import {_isArrayOfObjectsFieldMember, _isBlockType} from './_helpers'

/** @internal */
export interface PortableTextMemberItem {
  kind: 'annotation' | 'textBlock' | 'objectBlock' | 'inlineObject'
  key: string
  member: ArrayOfObjectsItemMember
  node: ObjectFormNode
  elementRef?: React.MutableRefObject<PortableTextEditorElement> | undefined
  input?: ReactNode
}

/**
 * @beta
 */
export interface PortableTextInputProps
  extends ArrayOfObjectsInputProps<PortableTextBlock, ArraySchemaType<PortableTextBlock>> {
  hotkeys?: HotkeyOptions
  markers?: PortableTextMarker[]
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
}

/**
 * The root Portable Text Input component
 *
 * @beta
 */
export function PortableTextInput(props: PortableTextInputProps) {
  const {
    focused,
    focusPath,
    hotkeys,
    markers = EMPTY_ARRAY,
    members,
    onChange,
    onCopy,
    onPathFocus,
    onInsert,
    onPaste,
    path,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    schemaType,
    value,
    elementProps,
  } = props

  // Make the PTE focusable from the outside
  useImperativeHandle(elementProps.ref, () => ({
    focus() {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    },
  }))

  const {subscribe} = usePatches({path})
  const editorRef = useRef<PortableTextEditor | null>(null)
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Let formState decide if we are focused or not.
  const hasFocus = Boolean(focused) || focusPath.length > 0

  // Set active if focused
  useEffect(() => {
    if (hasFocus) {
      setIsActive(true)
    }
  }, [hasFocus])

  const toast = useToast()
  const portableTextMemberItemsRef: React.MutableRefObject<PortableTextMemberItem[]> = useRef([])

  // Memoized patch stream
  const patchSubject: Subject<{
    patches: EditorPatch[]
    snapshot: PortableTextBlock[] | undefined
  }> = useMemo(() => new Subject(), [])
  const patches$ = useMemo(() => patchSubject.asObservable(), [patchSubject])

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  const handleToggleFullscreen = useCallback(() => {
    if (editorRef.current) {
      setIsFullscreen((v) => !v)
    }
  }, [])

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
        const isObjectBlock = !_isBlockType(member.item.schemaType)
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
            (f) => f.kind === 'field' && f.name === 'children'
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
            .filter(_isArrayOfObjectsFieldMember)
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
      let input: ReactNode

      if (item.kind !== 'textBlock') {
        input = <FormInput absolutePath={item.node.path} {...(props as FIXME)} />
      }

      if (existingItem) {
        existingItem.member = item.member
        existingItem.node = item.node
        existingItem.input = input
        return existingItem
      }

      return {
        kind: item.kind,
        key,
        member: item.member,
        node: item.node,
        elementRef: createRef<PortableTextEditorElement>(),
        input,
      }
    })

    portableTextMemberItemsRef.current = items

    return items
  }, [members, props])

  // Sets the focusPath from editor selection (when typing, moving the cursor, clicking around)
  // This doesn't need to be immediate, so debounce it as it impacts performance.
  const setFocusPathDebounced = useMemo(
    () =>
      debounce(
        (sel: EditorSelection) => {
          if (sel) {
            onPathFocus(sel.focus.path)
          }
        },
        500,
        {trailing: true, leading: true}
      ),
    [onPathFocus]
  )

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          onChange(toFormPatches(change.patches))
          break
        case 'selection':
          setFocusPathDebounced(change.selection)
          break
        case 'focus':
          setIsActive(true)
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
    },
    [onChange, toast, setFocusPathDebounced]
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
            readOnly={readOnly}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreInvalidValue, invalidValue, readOnly])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    }
  }, [isActive])

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
              readOnly={readOnly}
              schemaType={schemaType}
              value={value}
            >
              <Compositor
                {...props}
                hasFocus={hasFocus}
                hotkeys={hotkeys}
                isActive={isActive}
                isFullscreen={isFullscreen}
                onActivate={handleActivate}
                onChange={onChange}
                onCopy={onCopy}
                onInsert={onInsert}
                onPaste={onPaste}
                onToggleFullscreen={handleToggleFullscreen}
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
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE})) as FormPatch[]
}
