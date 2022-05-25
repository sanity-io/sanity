import {ArraySchemaType, ObjectSchemaType, Path} from '@sanity/types'
import {
  EditorChange,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  HotkeyOptions,
  InvalidValue,
  EditorSelection,
} from '@sanity/portable-text-editor'
import React, {useEffect, useState, useMemo, useCallback, useRef, useImperativeHandle} from 'react'
import {Subject} from 'rxjs'
import {Box, Text, useToast} from '@sanity/ui'
import scrollIntoView from 'scroll-into-view-if-needed'
import {startsWith} from '@sanity/util/paths'
import {throttle} from 'lodash'
import {FormPatch as FormBuilderPatch} from '../../patch'
import type {
  ArrayOfObjectsInputProps,
  FieldMember,
  ObjectMember,
  FIXME,
  PortableTextMarker,
  RenderCustomMarkers,
  ArrayOfObjectsMember,
} from '../../types'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {ObjectFormNode} from '../../types'
import {useDocumentPane} from '../../../desk/panes/document/useDocumentPane'
import {isMemberArrayOfObjects} from '../ObjectInput/members/asserters'
import {EMPTY_ARRAY} from '../../utils/empty'
import {Compositor} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {usePatches} from './usePatches'
import {VisibleOnFocusButton} from './VisibleOnFocusButton'
import {RenderBlockActionsCallback} from './types'

export type ObjectMemberType = ArrayOfObjectsMember<
  ObjectFormNode<
    {
      [x: string]: unknown
    },
    ObjectSchemaType
  >
>

function isFieldMember(member: ObjectMember): member is FieldMember<ObjectFormNode> {
  return member.kind === 'field'
}

/**
 * @alpha
 */
export interface PortableTextInputProps
  extends ArrayOfObjectsInputProps<PortableTextBlock, ArraySchemaType> {
  hotkeys?: HotkeyOptions
  markers?: PortableTextMarker[]
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
}

/**
 * An outer React PureComponent Class purely to satisfy the form-builder's need for 'blur' and 'focus' class methods.
 *
 * @alpha
 */
export function PortableTextInput(props: PortableTextInputProps) {
  const {onSetCollapsedPath} = useFormCallbacks()

  const {
    focused,
    focusPath,
    focusRef,
    hotkeys,
    markers = [],
    members,
    onChange,
    onCopy,
    onInsert,
    onPaste,
    onCollapse,
    onExpand,
    path,
    renderBlockActions,
    renderCustomMarkers,
    schemaType: type,
    value,
    onFocusPath,
    readOnly,
  } = props

  // Make the PTE focusable from the outside
  useImperativeHandle(focusRef, () => ({
    focus() {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    },
  }))

  const {subscribe} = usePatches({path})
  const editorRef = useRef<PortableTextEditor | null>(null)
  const [hasFocus, setHasFocus] = useState(false)
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const toast = useToast()

  // Memoized patch stream
  const remotePatchSubject: Subject<EditorPatch> = useMemo(() => new Subject(), [])
  const remotePatch$ = useMemo(() => remotePatchSubject.asObservable(), [remotePatchSubject])

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v)
    if (editorRef.current) PortableTextEditor.focus(editorRef.current)
  }, [editorRef])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Subscribe to incoming patches
  useEffect(() => {
    return subscribe(({patches}): void => {
      const patchSelection =
        patches && patches.length > 0 && patches.filter((patch) => patch.origin !== 'local')

      if (patchSelection) {
        patchSelection.map((patch) => remotePatchSubject.next(patch))
      }
    })
  }, [remotePatchSubject, subscribe])

  const onCollapse = useCallback(
    (p: Path) => {
      onSetCollapsedPath(p, true)
    },
    [onSetCollapsedPath]
  )

  const onExpand = useCallback(
    (childPath: Path) => {
      onSetCollapsedPath(path.concat(childPath), false)
    },
    [onSetCollapsedPath, path]
  )

  const portableTextMembers = useMemo((): ObjectMemberType[] => {
    return members.flatMap((m) => {
      let returned: ObjectMemberType[] = []
      // Object blocks or normal blocks with validation
      if (m.item.schemaType.name !== 'block' || m.item.schemaType.validation) {
        returned.push(m)
      }
      // Inline objects
      const childrenField = m.item.members.find((f) => f.kind === 'field' && f.name === 'children')
      if (
        childrenField &&
        childrenField.kind === 'field' &&
        isMemberArrayOfObjects(childrenField)
      ) {
        returned = [
          ...returned,
          ...childrenField.field.members.filter(
            (cM: ObjectMemberType) => 'item' in cM && cM.item.schemaType.name !== 'span'
          ),
        ]
      }
      // Markdefs
      const markDefArrayMember = m.item.members
        .filter(isFieldMember)
        .find((f) => f.name === 'markDefs')

      if (markDefArrayMember) {
        returned = [
          ...returned,
          ...(markDefArrayMember.field.members as unknown as ObjectMemberType[]), // TODO: fix correct typing on this
        ]
      }
      return returned
    })
  }, [members])

  // Sets the focusPath from editor selection
  const setFocusPathThrottled = useMemo(
    () =>
      throttle(
        (sel: EditorSelection) => {
          if (sel) onFocusPath(sel.focus.path)
          else {
            onFocusPath(EMPTY_ARRAY)
          }
        },
        300,
        {trailing: true, leading: true}
      ),
    [onFocusPath]
  )

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          onChange(change.patches as FormBuilderPatch[])
          break
        case 'selection':
          setFocusPathThrottled(change.selection)
          break
        case 'focus':
          setHasFocus(true)
          break
        case 'blur':
          setHasFocus(false)
          break
        case 'undo':
        case 'redo':
          onChange(change.patches as FormBuilderPatch[])
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
    [onChange, toast, setFocusPathThrottled]
  )

  const handleFocusSkipperClick = useCallback(() => {
    if (editorRef.current) {
      PortableTextEditor.focus(editorRef.current)
    }
  }, [editorRef])

  const handleIgnoreValidation = useCallback((): void => {
    setIgnoreValidationError(true)
  }, [])

  const respondToInvalidContent = useMemo(() => {
    if (invalidValue && invalidValue.resolution) {
      return (
        <Box marginBottom={2}>
          <RespondToInvalidContent
            onChange={handleEditorChange}
            onIgnore={handleIgnoreValidation}
            resolution={invalidValue.resolution}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreValidation, invalidValue])

  // Scroll to *the field* (not the editor content) into view if we have focus in the field.
  // For editor content scrolling see useScrollToFocusFromOutside and useScrollSelectionIntoView in
  // the Compositor component.
  useEffect(() => {
    if (focusPath && focusPath.length > 0 && innerElementRef.current) {
      scrollIntoView(innerElementRef.current, {
        scrollMode: 'if-needed',
      })
    }
  }, [focusPath])

  const {validation} = useDocumentPane()
  const objectValidation = useMemo(() => {
    return portableTextMembers
      .flatMap((m) => validation.filter((v) => startsWith(m.item.path, v.path)))
      .filter(Boolean)
  }, [portableTextMembers, validation])

  return (
    <Box ref={innerElementRef}>
      {!readOnly && (
        <VisibleOnFocusButton onClick={handleFocusSkipperClick}>
          <Text>Go to content</Text>
        </VisibleOnFocusButton>
      )}

      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && (
        <PortableTextEditor
          ref={editorRef}
          incomingPatches$={remotePatch$}
          onChange={handleEditorChange}
          maxBlocks={undefined} // TODO: from schema?
          readOnly={readOnly}
          type={type as FIXME}
          value={value}
        >
          <Compositor
            {...props}
            portableTextMembers={portableTextMembers}
            focusPath={focusPath}
            focused={focused}
            hasFocus={hasFocus}
            hotkeys={hotkeys}
            isFullscreen={isFullscreen}
            markers={markers}
            onChange={onChange}
            onFocusPath={onFocusPath}
            onCollapse={onCollapse}
            onCopy={onCopy}
            onExpand={onExpand}
            onInsert={onInsert}
            onPaste={onPaste}
            onCollapse={onCollapse}
            onExpand={onExpand}
            onToggleFullscreen={handleToggleFullscreen}
            renderBlockActions={renderBlockActions}
            renderCustomMarkers={renderCustomMarkers}
            value={value}
            validation={objectValidation}
          />
        </PortableTextEditor>
      )}
    </Box>
  )
}
