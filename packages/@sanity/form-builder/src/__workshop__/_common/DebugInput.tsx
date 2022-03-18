import {FormInputProps} from '@sanity/base/form'
import {TextArea, Theme} from '@sanity/ui'
import React, {useImperativeHandle, useRef} from 'react'
import styled, {css} from 'styled-components'

const DebugTextArea = styled(TextArea)(({theme}: {theme: Theme}) => {
  return css`
    font-family: ${theme.sanity.fonts.code.family};
  `
})

export const DebugInput = React.forwardRef(function DebugInput(props: FormInputProps, ref) {
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
