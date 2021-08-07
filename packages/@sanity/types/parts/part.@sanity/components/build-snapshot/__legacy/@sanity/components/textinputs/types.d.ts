/// <reference types="react" />
import {Path, Marker} from '_self_'
export interface DefaultTextInputProps extends React.HTMLProps<HTMLInputElement> {
  markers?: Marker[]
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
