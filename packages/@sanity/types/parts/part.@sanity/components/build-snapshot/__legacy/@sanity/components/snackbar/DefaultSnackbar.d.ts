import PropTypes from 'prop-types'
import React from 'react'
import {SnackbarAction} from './types'
interface DefaultSnackbarProps {
  kind?: 'info' | 'warning' | 'error' | 'success'
  title?: React.ReactNode
  subtitle?: React.ReactNode
  isPersisted?: boolean
  isCloseable?: boolean
  children?: React.ReactNode
  onClose?: () => void
  action?: SnackbarAction
  onAction?: () => void
  actionTitle?: string
  timeout?: number
  allowDuplicateSnackbarType?: boolean
}
export default class DefaultSnackbar extends React.PureComponent<DefaultSnackbarProps> {
  static contextTypes: {
    addToSnackQueue: PropTypes.Requireable<(...args: any[]) => any>
    handleDismissSnack: PropTypes.Requireable<(...args: any[]) => any>
    updateSnack: PropTypes.Requireable<(...args: any[]) => any>
  }
  snackId?: string
  componentDidMount(): void
  getSnackOptions(): {
    kind: 'error' | 'success' | 'warning' | 'info'
    title: React.ReactNode
    subtitle: React.ReactNode
    children: React.ReactNode
    onClose: () => void
    action: {
      title: string
      callback: () => void
    }
    isPersisted: boolean
    isCloseable: boolean
    autoDismissTimeout: number
    allowDuplicateSnackbarType: boolean
  }
  componentWillUnmount(): void
  componentDidUpdate(): void
  render(): any
}
export {}
