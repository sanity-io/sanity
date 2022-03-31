import React from 'react'
import {DefaultTextInputProps} from './types'
export default class DefaultTextInput extends React.PureComponent<DefaultTextInputProps> {
  _input: HTMLInputElement | null
  componentDidMount(): void
  UNSAFE_componentWillReceiveProps(nextProps: DefaultTextInputProps): void
  select(): void
  focus(): void
  setInput: (element: HTMLInputElement | null) => void
  render(): JSX.Element
}
