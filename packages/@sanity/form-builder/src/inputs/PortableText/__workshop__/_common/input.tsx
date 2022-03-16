import {TextArea, Theme} from '@sanity/ui'
import React, {forwardRef, useImperativeHandle, useRef} from 'react'
import styled, {css} from 'styled-components'
import {SchemaType} from '@sanity/types'
import {PortableTextInput} from '../../PortableTextInput'
import resolveInputComponent from '../../../../sanity/inputResolver/inputResolver'
import {FormBuilderContextValue} from '../../../../FormBuilderContext'

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

export const inputResolver = (formBuilder: FormBuilderContextValue, input: SchemaType) => {
  if (input.type.name === 'block') {
    return PortableTextInput
  }
  if (input.type.name === 'document') {
    // @TODO: remove this mutation
    input.type.name = 'object'
  }
  const resolved = resolveInputComponent(formBuilder.components.inputs, null, input.type)
  if (resolved) {
    return resolved
  }
  return DebugInput
}
