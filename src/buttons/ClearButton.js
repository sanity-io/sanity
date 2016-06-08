import equals from 'shallow-equals'

import React, {PropTypes} from 'react'

export default class extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

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
}
