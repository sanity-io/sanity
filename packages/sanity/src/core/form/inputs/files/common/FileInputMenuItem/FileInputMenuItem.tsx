// TODO: Verify after merge with MenuItems changes
import React, {createElement, isValidElement, useId} from 'react'
import {isValidElementType} from 'react-is'
import {Box, Flex, MenuItemProps, Text, TextProps} from '@sanity/ui'
import {FileMenuItem} from './FileInputMenuItem.styled'

export interface FileInputMenuItemProps extends MenuItemProps {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  disabled?: boolean
  textAlign?: TextProps['align']
}

export const FileInputMenuItem = React.forwardRef(function FileInputMenuItem(
  props: FileInputMenuItemProps &
    Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'ref' | 'type' | 'value' | 'onSelect'>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
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
  const id = `${idProp || ''}-${useId()}`

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(Array.from(event.target.files))
      }
    },
    [onSelect],
  )

  const content = (
    <Flex align="center" justify="flex-start" padding={padding}>
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
        <Text align={textAlign} size={fontSize} textOverflow="ellipsis">
          {text}
        </Text>
      )}
    </Flex>
  )

  return (
    <FileMenuItem
      {...rest}
      htmlFor={id}
      padding={0}
      fontSize={2}
      disabled={disabled}
      ref={forwardedRef}
    >
      {content}

      {/* Visibly hidden input */}
      <input
        data-testid="file-menuitem-input"
        accept={accept}
        capture={capture}
        id={id}
        multiple={multiple}
        onChange={handleChange}
        type="file"
        value=""
        disabled={disabled}
      />
    </FileMenuItem>
  )
})
