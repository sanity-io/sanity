import React from 'react'
interface PortalProps {
  children?: React.ReactNode
}
export declare class Portal extends React.Component<PortalProps> {
  node?: HTMLDivElement
  componentWillUnmount(): void
  render(): any
}
export {}
