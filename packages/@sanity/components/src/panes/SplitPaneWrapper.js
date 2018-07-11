import PropTypes from 'prop-types'
import React from 'react'

/**
 * SplitController plucks the props from this component and distributes panes,
 * so while this component might seem useless, it has a purpose.
 * @todo See if this can be done in a more intuitive way without this extra layer
 */
export default class SplitPaneWrapper extends React.PureComponent {
  /* eslint-disable react/no-unused-prop-types */
  static propTypes = {
    minWidth: PropTypes.number,
    maxWidth: PropTypes.number,
    defaultWidth: PropTypes.number,
    children: PropTypes.node
  }
  /* eslint-enable react/no-unused-prop-types */

  static defaultProps = {
    minWidth: 0,
    maxWidth: 0,
    defaultWidth: 0,
    children: undefined
  }

  render() {
    return this.props.children || <div />
  }
}
