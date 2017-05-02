import PropTypes from 'prop-types'
import React from 'react'
import GridList from 'part:@sanity/components/lists/grid'
import styles from './styles/ListView.css'
import InfiniteList from './InfiniteList'

export default class ListView extends React.PureComponent {

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

    switch (listLayout) {
      case 'card':
      case 'media': {
        return (
          <div className={styles.listContainer}>
            <GridList
              overrideItemRender
              items={items}
              layout={listLayout === 'card' ? 'masonry' : 'default'}
              getItemKey={getItemKey}
              renderItem={renderItem}
              selectedItem={selectedItem}
            />
          </div>
        )
      }
      default: {
        return (
          <InfiniteList
            className={styles.listContainer}
            items={items}
            getItemKey={getItemKey}
            renderItem={renderItem}
            selectedItem={selectedItem}
          />
        )
      }
    }
  }
}
