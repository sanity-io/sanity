import React, {PropTypes} from 'react'

export default React.createClass({
  propTypes: {
    className: PropTypes.string,
  },
  render() {
    return (
      <button
        className={this.props.className}
        type="button"
        title="Clear value"
      >
        ×
      </button>
    )
  }
})
