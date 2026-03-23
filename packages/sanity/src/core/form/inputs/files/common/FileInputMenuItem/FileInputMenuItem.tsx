import {type ForwardedRef, forwardRef, type HTMLProps, useCallback} from 'react'

import {MenuItem, type MenuItemProps} from '../../../../../../ui-components/menuItem/MenuItem'
import {openFilePicker} from '../openFilePicker'

export interface FileInputMenuItemProps extends Omit<MenuItemProps, 'onSelect'> {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  /** Called when the user cancels the file picker. */
  onFilePickerCancel?: () => void
  disabled?: boolean
}

export const FileInputMenuItem = forwardRef(function FileInputMenuItem(
  props: FileInputMenuItemProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'ref' | 'type' | 'value' | 'onSelect'>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {icon, accept, capture, multiple, onSelect, onFilePickerCancel, text, disabled, ...rest} =
    props

  const handleClick = useCallback(() => {
    if (disabled || !onSelect) return
    openFilePicker({
      accept,
      capture,
      multiple,
      onSelect,
      onCancel: onFilePickerCancel,
    })
  }, [accept, capture, disabled, multiple, onSelect, onFilePickerCancel])

  return (
    <MenuItem
      {...rest}
      disabled={disabled}
      ref={forwardedRef}
      icon={icon}
      text={text}
      onClick={handleClick}
    />
  )
})
