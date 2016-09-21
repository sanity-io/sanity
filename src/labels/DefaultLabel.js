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
    const {htmlFor, className, level} = this.props
    const levelClass = `level_${level}`
    return (
      <div className={`${styles.root} ${className} ${styles[levelClass]}`}>
        <label htmlFor={htmlFor}>
          {this.props.children}
        </label>
      </div>
    )
  }
}
