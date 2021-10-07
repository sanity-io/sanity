import {Card, Code} from '@sanity/ui'
import React, {forwardRef, useImperativeHandle} from 'react'
import PortableTextInput from '../PortableTextInput'

const DebugInput = forwardRef(function DebugInput(props: any, ref) {
  useImperativeHandle(ref, () => ({
    // eslint-disable-next-line no-console
    blur: (...args: unknown[]) => console.log('DebugInput.blur', ...args),
    // eslint-disable-next-line no-console
    focus: (...args: unknown[]) => console.log('DebugInput.focus', ...args),
  }))

  return (
    <Card overflow="auto" padding={3} radius={2} tone="transparent">
      <Code language="json">{JSON.stringify(props.value, null, 2)}</Code>
    </Card>
  )
})

export const inputResolver = (input: any) => {
  if (input.type.name === 'block') {
    return PortableTextInput
  }

  return DebugInput
}
