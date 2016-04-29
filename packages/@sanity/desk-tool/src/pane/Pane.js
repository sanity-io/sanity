import React, {PropTypes} from 'react'
import styles from 'style:desk-tool/styles'
import {Link} from 'router:@sanity/base/router'

const Pane = ({basePath, loading, items, activeItem}) =>
  <ul className={styles.pane}>
    {loading
      ? <li>Loading...</li>
      : items && items.map(item => {
        const href = `${basePath}/${item.pathSegment}`.replace(/^\/+/, '/')
        const className = activeItem === item.pathSegment
          ? styles.activePaneItemLink
          : styles.paneItemLink

        return (
          <li key={item.pathSegment} className={styles.paneItem}>
            <Link className={className} href={href}>{item.title}</Link>
          </li>
        )
      })
    }
  </ul>

Pane.defaultProps = {
  basePath: '/'
}

Pane.propTypes = {
  basePath: PropTypes.string,
  loading: PropTypes.bool,
  items: PropTypes.array,
  activeItem: PropTypes.any
}

export default Pane
