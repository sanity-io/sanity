import React, {useCallback} from 'react'
import {Stack} from '@sanity/ui'
import {EditorChange, Patch, PortableTextEditor} from '@sanity/portable-text-editor'
import {PortableTextInputProps, SANITY_PATCH_TYPE} from '../../../core'
import {useScratchPad} from '../../hooks/useScratchPad'
import {Editable} from './Editable'

export const ScratchPadInput = function ScratchPadInput(props: PortableTextInputProps) {
  const {onChange, schemaType, value} = props

  const {editorRef, onEditorFocus, onEditorBlur} = useScratchPad()

  const handleEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'mutation') {
        onChange(toFormPatches(change.patches))
      }
      if (change.type === 'focus') {
        onEditorFocus()
      }
      if (change.type === 'blur') {
        onEditorBlur()
      }
    },
    [onChange, onEditorBlur, onEditorFocus],
  )

  return (
    <Stack data-testid="scratchpad-input">
      <PortableTextEditor
        onChange={handleEditorChange}
        schemaType={schemaType}
        value={value}
        ref={editorRef}
      >
        <Editable formProps={props} />
      </PortableTextEditor>
    </Stack>
  )
}

function toFormPatches(patches: any) {
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE}))
}
