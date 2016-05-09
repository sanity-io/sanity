import React, {PropTypes} from 'react'
import {Link} from 'router:@sanity/base/router'
import equals from 'shallow-equals'
import styles from '../../styles/Pane.css'

class PaneItem extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  render() {
    const {href, className, title} = this.props

    return (
      <li className={styles.paneItem}>
        <Link className={className} href={href}>{title}</Link>
      </li>
    )
  }
}

PaneItem.propTypes = {
  href: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string
}

export default PaneItem
