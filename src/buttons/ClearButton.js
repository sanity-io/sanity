import React, {PropTypes} from 'react'

export default React.createClass({
  propTypes: {
    className: PropTypes.string,
    onClick: PropTypes.func
  },

  getDefaultProps() {
    return {
      value: '',
      onChange() {}
    }
  },

  shouldComponentUpdate(nextProps) {
    return !eq(this.props, nextProps)
  },

  render() {
    return (
      <button
        className={this.props.className}
        type="button"
        title="Clear value"
        onClick={() => this.handleChange()}
      >
        ×
      </button>
    )
  }
})
