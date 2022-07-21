import {hues} from '@sanity/color'
import {Box, TextInput} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import styled, {css} from 'styled-components'

type BackgroundTone = 'dark' | 'darker'

interface CustomTextInputProps extends ComponentProps<typeof TextInput> {
  backgroundTone?: BackgroundTone
  smallClearButton?: boolean
}

export const CustomTextInput = forwardRef<HTMLInputElement, CustomTextInputProps>(
  function CustomTextInput(props, ref) {
    const {backgroundTone, smallClearButton, ...rest} = props

    return (
      <CustomTextInputWrapper backgroundTone={backgroundTone} smallClearButton={smallClearButton}>
        <TextInput {...rest} ref={ref} />
      </CustomTextInputWrapper>
    )
  }
)

const CustomTextInputWrapper = styled(Box)(
  ({
    backgroundTone,
    smallClearButton,
  }: {
    backgroundTone?: BackgroundTone
    smallClearButton: boolean
  }) => {
    let backgroundColor: string
    if (backgroundTone === 'dark') {
      backgroundColor = hues.gray[50].hex
    }
    if (backgroundTone === 'darker') {
      backgroundColor = hues.gray[100].hex
    }

    return css`
      ${backgroundColor &&
      css`
        input + span {
          background: ${backgroundColor};
        }
      `}

      [data-qa='clear-button'] {
        background: none;
        box-shadow: none;
        display: flex; /* TODO: hack, currently used to vertically center <TextInput>'s clearButton */
        transform: ${smallClearButton ? 'scale(0.7)' : 'scale(1)'};
      }
    `
  }
)
