import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/default-style'
import ListItemWrapper from './items/ListItemWrapper'
import itemStyles from 'part:@sanity/components/lists/items/default-style'
import DefaultItem from 'part:@sanity/components/lists/items/default'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import {item as itemPropType} from './PropTypes'

const DragHandle = SortableHandle(() => <span className={itemStyles.dragHandle}><DragBarsIcon /></span>)

const SortableItem = SortableElement(({renderListItem, value, itemIndex}) => {
  return renderListItem(value, itemIndex)
})

const SortableListWrapper = SortableContainer(({sortableItems, renderListItem, getItemKey, className, ref}) => {
  return (
    <ul className={`${styles.sortableList} ${className}`} ref={ref}>
      {
        sortableItems.map((value, index) => {
          return (
            <SortableItem
              key={getItemKey(value, index)}
              index={index}
              itemIndex={index}
              value={value}
              renderListItem={renderListItem}
            />
          )
        })
      }
    </ul>
  )
})

export default class SortableList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(itemPropType),
    useDragHandle: PropTypes.bool,

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
    onSortStart: PropTypes.func,
    onSortMove: PropTypes.func,
    onSortEnd: PropTypes.func
  }

  static defaultProps = {
    onSelect() {},
    items: [],
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

  scrollElementIntoViewIfNeeded = itemElement => {

    const listElement = this._listElement
    const offset = itemElement.offsetTop

    if (!itemElement || !listElement) {
      return
    }

    if (listElement.scrollTop < offset) {
      listElement.scrollTop = offset - (listElement.offsetHeight / 2)
    }

  }

  renderListItem = (item, index) => {
    const {
      renderItem,
      getItemKey,
      decoration,
      selectedItem,
      highlightedItem,
      useDragHandle,
      overrideItemRender,
      onOpen,
      onSelect,
      focusedItem
    } = this.props

    const isSelected = item == selectedItem
    const hasFocus = focusedItem == item
    const isHighlighted = item == highlightedItem

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
        focus={hasFocus}
        highlighted={isHighlighted}
        decoration={decoration}
        scrollIntoView={this.scrollElementIntoViewIfNeeded}
      >
        {
          useDragHandle && <DragHandle />
        }
        {overrideItemRender ? renderedItem : (
          <DefaultItem
            key={key}
            item={item}
            onSelect={onSelect}
            onOpen={onOpen}
            selected={isSelected}
            focus={hasFocus}
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
      useDragHandle,
      onSortStart,
      onSortEnd,
      onSortMove,
      getItemKey
    } = this.props

    return (
      <div
        className={`
          ${scrollable ? styles.scrollable : styles.root}
          ${styles.isSortable}
          ${useDragHandle ? styles.usesDragHandle : ''}
          ${className || ''}
        `}
      >
        <SortableListWrapper
          sortableItems={items}
          onSortEnd={onSortEnd}
          onSortStart={onSortStart}
          onSortMove={onSortMove}
          className={scrollable ? styles.scrollableList : styles.list}
          helperClass={itemStyles.sortableHelper}
          transitionDuration={100}
          distance={0}
          axis="y"
          lockAxis="y"
          useDragHandle={useDragHandle}
          renderListItem={this.renderListItem}
          getItemKey={getItemKey}
          ref={this.setListElement}
          hideSortableGhost
        />
      </div>
    )
  }
}
