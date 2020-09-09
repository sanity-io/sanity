import PropTypes from 'prop-types'
import React from 'react'

/**
 * SplitController plucks the props from this component and distributes panes,
 * so while this component might seem useless, it has a purpose.
 * @todo See if this can be done in a more intuitive way without this extra layer
 */

export default class SplitPaneWrapper extends React.Component {
  /* eslint-disable react/no-unused-prop-types */
  static propTypes = {
    minSize: PropTypes.number,
    maxSize: PropTypes.number,
    defaultSize: PropTypes.number,
    children: PropTypes.node,
    index: PropTypes.number
  }
  /* eslint-enable react/no-unused-prop-types */

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
