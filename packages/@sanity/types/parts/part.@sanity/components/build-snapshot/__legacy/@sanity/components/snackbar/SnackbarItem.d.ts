import type React from 'react'
import {SnackbarAction} from './types'
export interface SnackbarItemProps {
  action?: SnackbarAction
  autoDismissTimeout?: number
  children?: React.ReactNode
  icon?: boolean
  isCloseable?: boolean
  isOpen?: boolean
  isPersisted?: boolean
  id: string | number
  kind?: 'info' | 'warning' | 'error' | 'success'
  title?: string | React.ReactNode
  subtitle?: string | React.ReactNode
  onDismiss: (id: string | number) => void
  offset?: number
  onClose?: () => void
  onSetHeight: (id: number, height: number) => void
  setFocus: boolean
  setAutoFocus?: boolean
}
interface State {
  isEntering: boolean
}
export default class SnackbarItem extends React.Component<SnackbarItemProps> {
  _dismissTimer?: number
  _enterTimer?: number
  _snackRef: React.RefObject<HTMLDivElement>
  state: State
  snackIcon: () => JSX.Element
  handleAutoDismissSnack: () => void
  handleMouseOver: () => void
  handleMouseLeave: () => void
  handleFocus: () => void
  handleBlur: () => void
  handleAction: () => void
  handleClose: () => void
  cancelAutoDismissSnack: () => void
  componentDidMount(): void
  componentWillUnmount(): void
  render(): JSX.Element
}
export {}
