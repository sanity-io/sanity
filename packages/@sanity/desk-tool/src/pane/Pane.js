import React, {PropTypes} from 'react'
import styles from '../../styles/Pane.css'
import PaneItem from './PaneItem'
import equals from 'shallow-equals'

class Pane extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  render() {
    const {basePath, loading, items, activeItem} = this.props

    return (
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
              <PaneItem
                key={item.pathSegment}
                title={item.title}
                className={className}
                href={href}
              />
            )
          })
        }
        </ul>
      </div>
    )
  }
}

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
