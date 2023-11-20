import React, {useCallback, useRef} from 'react'
import {Box, Stack} from '@sanity/ui'
import {useScratchPad} from '../../hooks/useScratchPad'
import {FloatingToolbar} from './toolbar/FloatingToolbar'
import {
  InputProps,
  PortableTextInput,
  PortableTextInputProps,
  RenderPortableTextInputEditableProps,
} from 'sanity'

/**
 *
 * @internal
 */
export const ScratchPadInput = function ScratchPadInput(props: InputProps) {
  const {
    onChange,
    placeholder = 'Write down your ideas',
    schemaType,
    value,
  } = props as PortableTextInputProps
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  const editableRef = useRef<HTMLDivElement | null>(null)
  const {editorRef, onEditorKeyDown} = useScratchPad()

  const renderPlaceholder = useCallback(() => <span>{placeholder}</span>, [placeholder])

  const renderEditable = useCallback(
    (editableProps: RenderPortableTextInputEditableProps) => {
      return (
        <Box ref={editableRef}>
          <FloatingToolbar rootElement={editableRef.current} />
          {editableProps.renderDefault({
            ...editableProps,
            onKeyDown: onEditorKeyDown,
            renderPlaceholder: renderPlaceholder,
          })}
        </Box>
      )
    },
    [onEditorKeyDown, renderPlaceholder],
  )

  return (
    <Stack data-testid="scratchpad-input" ref={rootElementRef}>
      <PortableTextInput
        {...(props as PortableTextInputProps)}
        editorRef={editorRef}
        fullscreen
        hideToolbar
        onChange={onChange}
        renderEditable={renderEditable}
        schemaType={schemaType}
        value={value}
      />
    </Stack>
  )
}
