import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/DraftList.css'

export default class DraftList extends React.Component {

  static propTypes = {
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    getItemKey: PropTypes.func,
    listLayout: PropTypes.oneOf(['default', 'media', 'cards', 'media']),
    selectedItem: PropTypes.object
  }

  static defaultProps = {
    listLayout: 'default',
    loading: false,
    items: [],
    selectedItem: null
  }

  render() {
    const {renderItem, items, selectedItem, listLayout, getItemKey} = this.props
    return (
      <div className={styles.root}>
        {items.map((item, i) => (
          <div key={getItemKey(item)}>{renderItem(item, i)}</div>
        ))}
      </div>
    )
  }

}
