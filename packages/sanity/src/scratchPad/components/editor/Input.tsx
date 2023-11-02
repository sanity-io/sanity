import React, {ReactNode, createRef, startTransition, useCallback, useMemo, useRef} from 'react'
import {Stack} from '@sanity/ui'
import {EditorChange, Patch, PortableTextEditor} from '@sanity/portable-text-editor'
import {InputProps, PortableTextInputProps, SANITY_PATCH_TYPE} from '../../../core'
import {useScratchPad} from '../../hooks/useScratchPad'
import {Editable} from './Editable'

/**
 * Input that wraps the editable surface and commits the changes
 *
 * @internal
 */
export const ScratchPadInput = function ScratchPadInput(props: InputProps) {
  const {onChange, schemaType, value, members, onPathFocus} = props as PortableTextInputProps

  const {editorRef, onEditorFocus, onEditorBlur} = useScratchPad()

  // Handle events from the PortableTextEditor
  const handleEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'mutation') {
        onChange(toFormPatches(change.patches))
      }
      if (change.type === 'selection') {
        onEditorFocus()
        startTransition(() => {
          if (change.selection) {
            onPathFocus(change.selection.focus.path)
          }
        })
      }
      if (change.type === 'blur') {
        onEditorBlur()
      }
    },
    [onChange, onEditorBlur, onEditorFocus, onPathFocus],
  )

  return (
    <Stack data-testid="scratchpad-input">
      <PortableTextEditor
        onChange={handleEditorChange}
        schemaType={schemaType}
        value={value}
        ref={editorRef}
      >
        <Editable formProps={props as PortableTextInputProps} />
      </PortableTextEditor>
    </Stack>
  )
}

function toFormPatches(patches: any) {
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE}))
}
