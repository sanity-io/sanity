import {TextArea, Theme} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled, {css} from 'styled-components'
import {
  // FormInputComponentResolver,
  InputProps,
} from '../../../../types'
import {set} from '../../../../patch'

const DebugTextArea = styled(TextArea)(({theme}: {theme: Theme}) => {
  return css`
    font-family: ${theme.sanity.fonts.code.family};
  `
})

function DebugInput(props: InputProps) {
  const {onChange, onBlur, onFocus, readOnly, focusRef} = props

  const handleChange = useCallback(() => {
    onChange(set({}))
  }, [onChange])

  return (
    <DebugTextArea
      onBlur={onBlur}
      onChange={handleChange}
      onFocus={onFocus}
      padding={3}
      radius={1}
      readOnly={readOnly}
      ref={focusRef}
      rows={100}
      value={JSON.stringify(props.value, null, 2)}
    />
  )
}

// export const resolveInputComponent: FormInputComponentResolver = () => {
//   return DebugInput
// }

// export const resolvePreviewComponent = () => {
//   return function PreviewAny() {
//     return <div>preview</div>
//   }
// }
