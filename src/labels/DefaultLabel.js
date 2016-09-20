import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/labels/default-style'

export default class DefaultLabel extends React.Component {
  static propTypes = {
    htmlFor: PropTypes.string.isRequired,
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    level: PropTypes.number
  }
  render() {
    const {htmlFor, className} = this.props
    return (
      <div className={`${styles.root} ${className}`}>
        <label htmlFor={htmlFor}>
          {this.props.children}
        </label>
      </div>
    )
  }
}
