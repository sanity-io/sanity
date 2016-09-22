import React, {PropTypes} from 'react'
import equals from 'shallow-equals'
import styles from './styles/PaneItem.css'

class PaneItem extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  render() {
    const {renderItem, item, index, view} = this.props

    return (
      <li className={styles[view]}>
        {renderItem(item, index)}
      </li>
    )
  }
}

PaneItem.propTypes = {
  renderItem: PropTypes.func,
  item: PropTypes.object,
  index: PropTypes.number,
  className: PropTypes.string,
  view: PropTypes.string
}

export default PaneItem
