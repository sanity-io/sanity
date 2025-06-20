import {TextArea, type Theme} from '@sanity/ui'
import {forwardRef, useImperativeHandle, useRef} from 'react'
import {css, styled} from 'styled-components'

import type {InputProps} from '../../types/inputProps'

const DebugTextArea = styled(TextArea)(({theme}: {theme: Theme}) => {
  return css`
    font-family: ${theme.sanity.fonts.code.family};
  `
})

export const DebugInput = forwardRef(function DebugInput(props: InputProps, ref) {
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
