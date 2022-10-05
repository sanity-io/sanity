import {TextArea, Theme} from '@sanity/ui'
import React, {forwardRef, useImperativeHandle, useRef} from 'react'
import styled, {css} from 'styled-components'
import {SchemaType} from '@sanity/types'
import {PortableTextInput} from '../../PortableTextInput'
import {defaultResolveInputComponent} from '../../../../studio/inputResolver/inputResolver'
import {InputProps} from '../../../../types'
import {SanityFormConfig} from '../../../../../config'

const DebugTextArea = styled(TextArea)(({theme}: {theme: Theme}) => {
  return css`
    font-family: ${theme.sanity.fonts.code.family};
  `
})

const DebugInput = forwardRef(function DebugInput(props: InputProps, ref) {
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

export function inputResolver(
  input: SchemaType,
  form: SanityFormConfig
): React.ComponentType<Omit<InputProps, 'renderDefault'>> {
  if (!input.type) {
    throw new Error('inputResolver: missing subtype')
  }

  if (input.type.name === 'block') {
    return PortableTextInput as any
  }

  // if (input.type.name === 'document') {
  //   // @TODO: remove this mutation
  //   input.type.name = 'object'
  // }

  return defaultResolveInputComponent(input.type) || DebugInput
}
