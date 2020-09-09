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
  static defaultProps = {
    minSize: 100,
    maxSize: 500,
    defaultSize: 321,
    children: undefined
  }

  render() {
    return this.props.children || <div />
  }
}
