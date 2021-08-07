import React from 'react'
interface HotkeysProps {
  size?: 'small' | 'medium' | 'large'
  keys?: string[]
}
export default class Hotkeys extends React.PureComponent<HotkeysProps> {
  static defaultProps: {
    size: any
  }
  render(): JSX.Element
}
export {}
