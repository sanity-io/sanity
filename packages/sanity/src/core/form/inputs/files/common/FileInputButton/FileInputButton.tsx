import React, {useId} from 'react'
import {ButtonProps} from '../../../../../../ui'
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

  return (
    <FileButton {...rest} icon={icon} text={text} htmlFor={id} disabled={disabled}>
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
