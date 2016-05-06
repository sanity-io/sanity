import React, {PropTypes} from 'react'
import styles from '../../styles/Pane.css'
import {Link} from 'router:@sanity/base/router'

const Pane = ({basePath, loading, items, activeItem}) =>
  <div className={styles.pane}>
    <ul className={styles.paneItems}>
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
  </div>

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
