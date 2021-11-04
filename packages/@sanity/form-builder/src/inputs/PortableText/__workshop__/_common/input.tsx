import {TextArea, Theme} from '@sanity/ui'
import React, {forwardRef, useImperativeHandle, useRef} from 'react'
import styled, {css} from 'styled-components'
import {PortableTextInput} from '../../PortableTextInput'

const DebugTextArea = styled(TextArea)(({theme}: {theme: Theme}) => {
  return css`
    font-family: ${theme.sanity.fonts.code.family};
  `
})

const DebugInput = forwardRef(function DebugInput(props: any, ref) {
  const rootRef = useRef<HTMLTextAreaElement | null>(null)

  useImperativeHandle(ref, () => ({
    blur: () => rootRef.current?.blur(),
    focus: () => rootRef.current?.focus(),
  }))

  return (
    <DebugTextArea
      padding={3}
      radius={1}
      readOnly
      ref={rootRef}
      rows={10}
      value={JSON.stringify(props.value, null, 2)}
    />
  )
})

export const inputResolver = (input: any) => {
  if (input.type.name === 'block') {
    return PortableTextInput
  }

  return DebugInput
}
