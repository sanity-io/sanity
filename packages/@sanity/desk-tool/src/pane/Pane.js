import React, {PropTypes} from 'react'
import styles from '../../styles/DeskTool.css'
import {Link} from 'router:@sanity/base/router'

const Pane = ({basePath, loading, items, activeItem}) =>
  <ul className={styles.pane}>
    {loading
      ? <li>Loading...</li>
      : items && items.map(item => {
        const href = `${basePath}/${item.pathSegment}`.replace(/^\/+/, '/')
        return (
          <li key={item.pathSegment} className={styles.paneItem}>
            <Link className={styles.paneItemLink} href={href}>{item.title}</Link>
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
