import {Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {transparentize} from 'polished'
import styled from 'styled-components'
import {StringInputProps, set} from 'sanity'

const StyledColorInput = styled.input.attrs({type: 'color'})`
  cursor: pointer;
  box-sizing: border-box;
  background: var(--card-border-color);
  border: 0 solid transparent;
  border-radius: 2px;
  padding: 0;
  appearance: none;
  margin: 0;
  height: 1.6rem;
  width: 8ch;

  &:hover {
    box-shadow: 0 0 0 2px ${({theme}) => theme.sanity.color.card.hovered.border};
  }

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    padding: 0;
    border: 0 solid transparent;
    border-radius: 2px;
    box-shadow: inset 0 0 0 1px
      ${({theme}) => transparentize(0.8, theme.sanity.color.card.enabled.fg)};
  }

  &::-moz-color-swatch {
    padding: 0;
    border: 0 solid transparent;
    border-radius: 2px;
    box-shadow: inset 0 0 0 1px
      ${({theme}) => transparentize(0.8, theme.sanity.color.card.enabled.fg)};
  }
`

export default function ColorInput(props: StringInputProps) {
  const {value, onChange, id} = props
  // const id = useId()
  const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      onChange(set(event.target.value))
    },
    [onChange],
  )

  return (
    <Stack space={2}>
      <StyledColorInput id={id} value={value} onChange={handleChange} />
      <output htmlFor={id}>
        <Text muted size={0}>
          {value}
        </Text>
      </output>
    </Stack>
  )
}
