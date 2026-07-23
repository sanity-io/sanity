import {
  type ChangeEvent,
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  useCallback,
  useId,
} from 'react'

import {type ButtonProps} from '../../../../../../ui-components'
import {FileButton} from './styles'

export type FileInputButtonProps = ButtonProps & {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  disabled?: boolean
}

export const FileInputButton = forwardRef(function FileInputButton(
  props: FileInputButtonProps &
    Omit<HTMLProps<HTMLButtonElement>, 'as' | 'ref' | 'type' | 'value' | 'onSelect'>,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  // `text` and `icon` stay in `rest` so the ButtonWithText | IconButton union
  // stays correlated when spread onto the styled component.
  const {id: idProp, accept, capture, multiple, onSelect, disabled, ...rest} = props
  const id = `${idProp || ''}-${useId()}`

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(Array.from(event.target.files))
      }
    },
    [onSelect],
  )

  return (
    <FileButton {...rest} htmlFor={id} disabled={disabled}>
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
