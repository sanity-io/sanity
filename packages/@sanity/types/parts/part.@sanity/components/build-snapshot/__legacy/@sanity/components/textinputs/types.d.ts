/// <reference types="react" />
import {Path, ValidationMarker} from '_self_'
export interface DefaultTextInputProps extends React.HTMLProps<HTMLInputElement> {
  validation?: ValidationMarker[]
  focusPath?: Path
  onClear?: () => void
  isClearable?: boolean
  isSelected?: boolean
  hasError?: boolean
  customValidity?: string
  styles?: {
    container?: string
    input?: string
    isClearable?: string
    isDisabled?: string
    clearButton?: string
    inputOnDisabled?: string
    inputOnError?: string
    containerOnError?: string
  }
  inputId?: string
}
