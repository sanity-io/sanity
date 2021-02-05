// todo: consider moving this into @sanity/ui and make it exposed as a primitive

import React from 'react'
import {useId} from '@reach/auto-id'
import styled, {css} from 'styled-components'
import {Button, Theme} from '@sanity/ui'

import {focusRingBorderStyle, focusRingStyle} from '../focusringUtils'

type Props = Omit<React.ComponentProps<typeof Button>, 'type' | 'value' | 'onSelect'> & {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  children?: React.ReactNode
}

const Input = styled.input`
  overflow: hidden;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  position: absolute;
`

// Note: this is rendered as a label
const SelectButton = styled(Button)(({theme}: {theme: Theme}) => {
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

    // This is a little hack to fix wonky @sanity/ui Button rendering where there's a child element.
    // This issue should be fixed in @sanity/ui and this hack removed from here.
    & span:nth-child(2) {
      width: 0;
      flex: none;
    }
  `
})

export const FileInputButton = React.forwardRef(function FileInputButton(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {children, id: _, accept, capture, multiple, onSelect, ...rest} = props

  const id = useId(props.id)
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(Array.from(event.target.files))
      }
    },
    [onSelect]
  )

  return (
    <SelectButton {...rest} forwardedAs="label" inputId={id}>
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
