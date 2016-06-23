import React, {PropTypes} from 'react'
// import Ink from 'react-inc'
// import styles from 'style:@sanity/base/theme/buttons/default'

export default class DefaultButton extends React.Component {
  static propTypes = {
    kind: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node,
    inverted: PropTypes.bool,
    icon: PropTypes.node
  }

  render() {
    const {onClick, kind} = this.props

    return (
      <button
        type="button"
        title="Clear value"
        onClick={onClick}
      >
        <span>
          {this.props.icon}
        </span>
        <span>
          {this.props.children}
        </span>
      </button>
    )
  }
}
