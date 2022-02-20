import React, {createElement, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import {useId} from '@reach/auto-id'
import {Box, ButtonProps, Flex, Text, useTheme} from '@sanity/ui'
import {FileButton} from './styles'

export interface FileInputButtonProps extends ButtonProps {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  disabled?: boolean
}

export const FileInputButton = React.forwardRef(function FileInputButton(
  props: FileInputButtonProps &
    Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'ref' | 'type' | 'value' | 'onSelect'>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {
    icon,
    id: idProp,
    accept,
    capture,
    fontSize,
    multiple,
    onSelect,
    padding = 3,
    space = 3,
    textAlign,
    text,
    disabled,
    ...rest
  } = props
  const id = useId(idProp)
  const theme = useTheme()

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(Array.from(event.target.files))
      }
    },
    [onSelect]
  )

  const content = (
    <Flex align="center" justify="center" padding={padding}>
      {/* Icon */}
      {icon && (
        <Box marginRight={text ? space : undefined}>
          <Text size={fontSize}>
            {isValidElement(icon) && icon}
            {isValidElementType(icon) && createElement(icon)}
          </Text>
        </Box>
      )}

      {/* Text */}
      {text && (
        <Text
          align={textAlign}
          size={fontSize}
          textOverflow="ellipsis"
          weight={theme.sanity.button.textWeight}
        >
          {text}
        </Text>
      )}
    </Flex>
  )

  return (
    <FileButton {...rest} htmlFor={id} padding={0} fontSize={2} disabled={disabled}>
      {content}

      {/* Visibly hidden input */}
      <input
        data-testid="file-button-input"
        accept={accept}
        capture={capture}
        id={id}
        multiple={multiple}
        onChange={handleChange}
        ref={forwardedRef}
        type="file"
        value=""
        disabled={disabled}
      />
    </FileButton>
  )
})
