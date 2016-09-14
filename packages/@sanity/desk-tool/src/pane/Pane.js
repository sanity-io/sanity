import React, {PropTypes} from 'react'
import styles from '../../styles/Pane.css'

function Pane(props) {
  const {loading, items, renderItem, isActive} = props
  return (
    <div className={isActive ? styles.isActive : styles.pane}>
      <ul className={styles.paneItems}>
        {loading && <li>Loading...</li>}
        {items.map((item, i) => {
          return (
            <li className={styles.paneItem} key={item.key}>
              {renderItem(item, i)}
            </li>
          )
        })
        }
      </ul>
    </div>
  )
}

Pane.defaultProps = {
  isActive: false,
  items: []
}

Pane.propTypes = {
  isActive: PropTypes.bool,
  loading: PropTypes.bool,
  items: PropTypes.array,
  renderItem: PropTypes.func
}

export default Pane
