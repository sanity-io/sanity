import React from 'react'

interface CustomPreviewProps {
  children?: React.ReactNode
}

export default class CustomPreview extends React.PureComponent<CustomPreviewProps> {
  render() {
    const {children} = this.props

    return <div>{children}</div>
  }
}
