import React, {useCallback, useId} from 'react'
import {MenuItemProps} from '../../../../../ui-components'
import {FileMenuItem} from './FileInputMenuItem.styled'

export interface FileInputMenuItemProps extends Omit<MenuItemProps, 'onSelect'> {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  disabled?: boolean
}

export const FileInputMenuItem = React.forwardRef(function FileInputMenuItem(
  props: FileInputMenuItemProps &
    Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'ref' | 'type' | 'value' | 'onSelect'>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {icon, id: idProp, accept, capture, multiple, onSelect, text, disabled, ...rest} = props
  const id = `${idProp || ''}-${useId()}`

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(Array.from(event.target.files))
      }
    },
    [onSelect],
  )

  const renderMenuItem = useCallback(
    (item: React.JSX.Element) => (
      <div>
        {item}
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
      </div>
    ),
    [accept, capture, disabled, handleChange, id, multiple],
  )
  return (
    <FileMenuItem
      {...rest}
      htmlFor={id}
      disabled={disabled}
      ref={forwardedRef}
      icon={icon}
      text={text}
      renderMenuItem={renderMenuItem}
    />
  )
})
