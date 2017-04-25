import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/lists/default-style'
import ListItemWrapper from './items/ListItemWrapper'
import DefaultItem from 'part:@sanity/components/lists/items/default'
import {item as itemPropType} from './PropTypes'


export default class DefaultList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(itemPropType),

    scrollable: PropTypes.bool,

    selectedItem: itemPropType,
    highlightedItem: itemPropType,
    focusedItem: itemPropType,
    className: PropTypes.string,

    overrideItemRender: PropTypes.bool,

    renderItem: PropTypes.func,
    getItemKey: PropTypes.func,

    decoration: PropTypes.string,
    onOpen: PropTypes.func,
    onSelect: PropTypes.func,
  }

  static defaultProps = {
    onSelect() {},
    onOpen() {},
    overrideItemRender: false,
    renderItem(item) {
      return item
    },
    getItemKey(item, index) {
      return `list-item-${index}`
    }
  }

  setListElement = element => {
    this._listElement = element
  }

  renderListItem = (item, index) => {
    const {
      renderItem,
      getItemKey,
      decoration,
      selectedItem,
      highlightedItem,
      overrideItemRender,
      onOpen,
      onSelect,
      focusedItem
    } = this.props

    const isSelected = item === selectedItem
    const hasFocus = focusedItem === item
    const isHighlighted = item === highlightedItem

    const renderedItem = renderItem(item, index, {
      isSelected,
      isHighlighted,
      hasFocus
    })

    const key = getItemKey(item, index)
    return (
      <ListItemWrapper
        className={styles.item}
        index={index}
        key={key}
        item={item}
        onSelect={onSelect}
        selected={isSelected}
        hasFocus={hasFocus}
        highlighted={isHighlighted}
        decoration={decoration}
        scrollIntoView={this.scrollElementIntoViewIfNeeded}
      >
        {overrideItemRender ? renderedItem : (
          <DefaultItem
            key={key}
            item={item}
            onSelect={onSelect}
            onOpen={onOpen}
            selected={isSelected}
            hasFocus={hasFocus}
          >

            {renderedItem}
          </DefaultItem>
        )}
      </ListItemWrapper>
    )
  }

  render() {
    const {
      items,
      className,
      scrollable,
    } = this.props

    return (
      <div
        className={`
          ${scrollable ? styles.scrollable : styles.root}
          ${className || ''}
        `}
      >
        <ul className={scrollable ? styles.scrollableList : styles.list} ref={this.setListElement}>
          {
            items && items.map(this.renderListItem)
          }
        </ul>
      </div>
    )
  }
}
