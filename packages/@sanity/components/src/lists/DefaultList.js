import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/default-style'
import ListItemWrapper from './items/ListItemWrapper'
import itemStyles from 'part:@sanity/components/lists/items/default-style'
import DefaultItem from 'part:@sanity/components/lists/items/default'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import {item as itemPropType} from './PropTypes'

const DragHandle = SortableHandle(() => <span className={itemStyles.dragHandle}><DragBarsIcon /></span>)

const SortableItem = SortableElement(({renderListItem, value}) => {
  return renderListItem(value, value.index)
})

const SortableList = SortableContainer(({sortableItems, renderListItem, className, ref}) => {
  return (
    <ul className={`${styles.sortableList} ${className}`} ref={ref}>
      {
        sortableItems.map((value, index) => {
          value.index = index
          return (
            <SortableItem
              key={`sortableItem-${index}`}
              index={index}
              value={value}
              renderListItem={renderListItem}
            />
          )
        })
      }
    </ul>
  )
})

export default class DefaultList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(itemPropType),
    useDragHandle: PropTypes.bool,

    scrollable: PropTypes.bool,
    sortable: PropTypes.bool,

    selectedItem: itemPropType,
    highlightedItem: itemPropType,
    focusedItem: itemPropType,
    className: PropTypes.string,

    overrideItemRender: PropTypes.bool,

    renderItem: PropTypes.func,

    decoration: PropTypes.string,
    onOpen: PropTypes.func,
    onSelect: PropTypes.func,
    onSortStart: PropTypes.func,
    onSortMove: PropTypes.func,
    onSortEnd: PropTypes.func
  }

  static defaultProps = {
    onSelect() {},
    onOpen() {},
    sortable: false,
    overrideItemRender: false,
    renderItem(item) {
      return item
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
      decoration,
      selectedItem,
      highlightedItem,
      sortable,
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

    return (
      <ListItemWrapper
        className={styles.item}
        index={index}
        key={`item-${index}`}
        item={item}
        onSelect={onSelect}
        selected={isSelected}
        focus={hasFocus}
        highlighted={isHighlighted}
        decoration={decoration}
        scrollIntoView={this.scrollElementIntoViewIfNeeded}
      >
        {
          sortable && useDragHandle && <DragHandle />
        }
        {overrideItemRender ? renderedItem : (
          <DefaultItem
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
      sortable,
      useDragHandle,
      onSortStart,
      onSortEnd,
      onSortMove
    } = this.props

    return (
      <div
        className={`
          ${scrollable ? styles.scrollable : styles.root}
          ${sortable ? styles.isSortable : ''}
          ${useDragHandle ? styles.usesDragHandle : ''}
          ${className}
        `}
      >

        {
          !sortable && <ul className={scrollable ? styles.scrollableList : styles.list} ref={this.setListElement}>
            {
              items && items.map((item, index) => {
                return (
                  this.renderListItem(item, index)
                )
              })
            }
          </ul>
        }
        {
          sortable && (
            <SortableList
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
              ref={this.setListElement}
              hideSortableGhost
            />
          )
        }

      </div>
    )
  }
}
