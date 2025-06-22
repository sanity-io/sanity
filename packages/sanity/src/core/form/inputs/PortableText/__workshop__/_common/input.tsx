import {type SchemaType} from '@sanity/types'
import {TextArea, type Theme} from '@sanity/ui'
import {type ComponentType, forwardRef, useImperativeHandle, useRef} from 'react'
import {css, styled} from 'styled-components'

import type {SanityFormConfig} from '../../../../../config/types'
import {defaultResolveInputComponent} from '../../../../studio/inputResolver/inputResolver'
import type {InputProps} from '../../../../types/inputProps'
import {PortableTextInput} from '../../PortableTextInput'

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
  form: SanityFormConfig,
): ComponentType<Omit<InputProps, 'renderDefault'>> {
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
