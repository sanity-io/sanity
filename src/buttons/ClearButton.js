import {eq} from 'lodash'
import React, {PropTypes} from 'react'

export default React.createClass({
  propTypes: {
    className: PropTypes.string,
    onClick: PropTypes.func
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  shouldComponentUpdate(nextProps) {
    return !eq(this.props, nextProps)
  },

  render() {
    const {onClick, className} = this.props
    return (
      <button
        className={className}
        type="button"
        title="Clear value"
        onClick={onClick}
      >
        ×
      </button>
    )
  }
})
