import React from 'react'
/**
 * SplitController plucks the props from this component and distributes panes,
 * so while this component might seem useless, it has a purpose.
 * @todo See if this can be done in a more intuitive way without this extra layer
 */
interface SplitPaneWrapperProps {
  minSize?: number
  maxSize?: number
  defaultSize?: number
  children?: React.ReactNode
  index?: number
}
export default class SplitPaneWrapper extends React.Component<SplitPaneWrapperProps> {
  static defaultProps: {
    minSize: number
    maxSize: number
    defaultSize: number
    children: any
  }
  render(): {}
}
export {}
