import PropTypes from 'prop-types'
import React from 'react'
import {List as GridList, Item as GridListItem} from 'part:@sanity/components/lists/grid'
import InfiniteList from './InfiniteList'
import styles from './styles/ListView.css'

export default class ListView extends React.PureComponent {
  static propTypes = {
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    getItemKey: PropTypes.func,
    listLayout: PropTypes.oneOf(['default', 'detail', 'card', 'media']),
    selectedItem: PropTypes.object,
    onScroll: PropTypes.func
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
      case 'card': {
        // todo: this part is disabled and deliberately *not* adjusted after lists refactoring
        return (
          <GridList className={styles.cardList}>
            {items.map(item => {
              // const isSelected = selectedItem === item /* todo: use to decorate with selected class etc. */
              return (
                <GridListItem key={getItemKey(item)} className={styles.cardListItem}>
                  {renderItem(item)}
                </GridListItem>
              )
            })}
          </GridList>
        )
      }
      case 'media': {
        // todo: this part is disabled and deliberately *not* adjusted after lists refactoring
        return (
          <GridList className={styles.mediaList}>
            {items.map(item => {
              // const isSelected = selectedItem === item /* todo: use to decorate with selected class etc. */
              return (
                <GridListItem key={getItemKey(item)} className={styles.mediaListItem}>
                  {renderItem(item)}
                </GridListItem>
              )
            })}
          </GridList>
        )
      }
      default: {
        return (
          <InfiniteList
            className={styles.scroll}
            onScroll={this.props.onScroll}
            items={items}
            getItemKey={getItemKey}
            renderItem={renderItem}
            layout={listLayout}
            selectedItem={selectedItem}
          />
        )
      }
    }
  }
}
