import type React from 'react'
interface DefaultFileInputProps {
  onSelect?: (files: FileList | null) => void
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}
export default class DefaultFileInput extends React.PureComponent<DefaultFileInputProps> {
  _inputId: string
  componentDidMount(): void
  handleSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  render(): JSX.Element
}
export {}
