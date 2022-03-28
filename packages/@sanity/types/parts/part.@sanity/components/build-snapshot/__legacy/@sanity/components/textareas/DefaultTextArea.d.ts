import type React from 'react'
interface DefaultTextAreaProps {
  onClear?: (event?: unknown) => void
  customValidity?: string
  isClearable?: boolean
  hasFocus?: boolean
  inputId?: string
}
export default class DefaultTextArea extends React.Component<
  DefaultTextAreaProps & Omit<React.HTMLProps<HTMLTextAreaElement>, 'id'>
> {
  _input: HTMLTextAreaElement | null
  handleClear: (event: unknown) => void
  select(): void
  focus(): void
  setInput: (element: HTMLTextAreaElement | null) => void
  componentDidMount(): void
  UNSAFE_componentWillReceiveProps(nextProps: DefaultTextAreaProps): void
  render(): JSX.Element
}
export {}
