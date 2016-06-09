import React, {PropTypes} from 'react'
import styles from './styles/Default.css'

export default class DefaultButton extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node
  }

  render() {
    const {onClick, className} = this.props
    return (
      <button
        className={styles.root}
        type="button"
        title="Clear value"
        onClick={onClick}
      >
        {this.props.children}
      </button>
    )
  }
}
