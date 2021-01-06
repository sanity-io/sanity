import React from 'react'
import {useId} from '@reach/auto-id'
import styled, {css} from 'styled-components'
import {Button, Theme} from '@sanity/ui'
// todo: import these utils from @sanity/ui instead
import {focusRingBorderStyle, focusRingStyle} from './focusringUtils'

type Props = Omit<React.ComponentProps<typeof Button>, 'type' | 'value' | 'onSelect'> & {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: FileList) => void
  children?: React.ReactNode
}

const Input = styled.input`
  overflow: hidden;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  position: absolute;
  z-index: -1;
`

const SelectButton = styled(Button)`
  ${({theme}: {theme: Theme}) => {
    const border = {width: 1, color: 'var(--card-border-color)'}

    return css`
      &:not([data-disabled='true']) {
        &:focus-within {
          box-shadow: ${focusRingStyle({
            base: theme.sanity.color.base,
            border,
            focusRing: theme.sanity.focusRing,
          })};
        }
        &:focus:not(:focus-visible) {
          box-shadow: ${focusRingBorderStyle(border)};
        }
      }
    `
  }}
`

export const FileInputButton = React.forwardRef(function FileInputButton(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {children, id: _, accept, capture, multiple, onSelect, ...rest} = props

  const id = useId(props.id)
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(event.target.files)
      }
    },
    [onSelect]
  )

  return (
    <SelectButton {...rest} forwardedAs="label" htmlFor={id}>
      <Input
        type="file"
        value=""
        id={id}
        onChange={handleChange}
        ref={forwardedRef}
        accept={accept}
        capture={capture}
        multiple={multiple}
      />
      {children}
    </SelectButton>
  )
})
