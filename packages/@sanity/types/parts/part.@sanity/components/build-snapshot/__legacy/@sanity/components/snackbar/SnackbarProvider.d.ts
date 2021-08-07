import React from 'react'
import PropTypes from 'prop-types'
import {SnackbarItemType} from './types'
interface SnackbarProviderProps {
  children: React.ReactNode
}
interface State {
  activeSnacks: SnackbarItemType[]
}
export default class SnackbarProvider extends React.Component<SnackbarProviderProps, State> {
  static childContextTypes: {
    addToSnackQueue: PropTypes.Requireable<(...args: any[]) => any>
    handleDismissSnack: PropTypes.Requireable<(...args: any[]) => any>
    updateSnack: PropTypes.Requireable<(...args: any[]) => any>
  }
  state: State
  maxStack: number
  snackQueue: SnackbarItemType[]
  _removeTimer?: number
  get offsets(): number[]
  handleSetHeight: (id: number, height: number) => void
  addToSnackQueue: (contextSnack: SnackbarItemType) => string | number
  updateSnack: (snackId: any, contextSnack: any) => void
  handleMaxSnackDisplay: () => void
  processSnackQueue: () => void
  handleDismissOldestSnack: () => void
  handleDismissSnack: (id: number | string) => void
  handleRemoveSnack: (id: number | string) => void
  componentWillUnmount(): void
  getChildContext: () => {
    addToSnackQueue: (contextSnack: SnackbarItemType) => string | number
    handleDismissSnack: (id: number | string) => void
    updateSnack: (snackId: any, contextSnack: any) => void
  }
  render(): JSX.Element
}
export {}
