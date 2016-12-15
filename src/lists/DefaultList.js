import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/default-style'
import ListItem from 'part:@sanity/components/lists/items/default'
import itemStyles from 'part:@sanity/components/lists/items/default-style'
import ReactDOM from 'react-dom'
import DefaultPreview from 'part:@sanity/components/previews/default'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'
import DragBarsIcon from 'part:@sanity/base/bars-icon'

const DragHandle = SortableHandle(() => <span className={itemStyles.dragHandle}><DragBarsIcon /></span>)


const SortableItem = SortableElement(({value, index, renderListItem, props}) => {
  return renderListItem(value, props, index)
})

const SortableList = SortableContainer(({sortableItems, renderListItem}) => {
  return (
    <ul className={styles.sortableList}>
      {
        sortableItems.map((value, index) => {
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
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        index: PropTypes.string,
        content: PropTypes.node,
        extraContent: PropTypes.node,
        icon: PropTypes.node
      })
    ),
    onSelect: PropTypes.func,
    onSortStart: PropTypes.func,
    onSortMove: PropTypes.func,
    onSortEnd: PropTypes.func,
    useDragHandle: PropTypes.bool,
    scrollable: PropTypes.bool,
    selectable: PropTypes.bool,
    selectedItem: PropTypes.object,
    highlightedItem: PropTypes.object,
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    renderItem: PropTypes.func,
    ListItemContainer: PropTypes.func,
    decoration: PropTypes.string,
    sortable: PropTypes.bool
  }

  static defaultProps = {
    onSelect() {},
    sortable: false,
    renderItem(item, i) {
      return (
        <DefaultPreview item={item} />
      )
    }
  }

  handleSelect = item => {
    this.props.onSelect(item)
  }

  scrollElementIntoViewIfNeeded = domNode => {
    const containerDomNode = ReactDOM.findDOMNode(this)
    const offset = domNode.offsetTop
    if ((containerDomNode.scrollTop + containerDomNode.offsetHeight) < offset) {
      // Todo think more about this
      // Moving down
      containerDomNode.scrollTop = offset
    }// } else if ((containerDomNode.scrollTop + containerDomNode.offsetHeight) > offset) {
    //   // Moving down
    //   containerDomNode.scrollTop = offset
    // }
  }

  renderListItem = (item, index) => {

    const {
      ListItemContainer = ListItem,
      renderItem,
      decoration,
      selectedItem,
      highlightedItem,
      sortable,
      useDragHandle
    } = this.props

    return (
      <ListItemContainer
        className={styles.item}
        index={item.index}
        key={`item-${index}`}
        item={item}
        onSelect={this.handleSelect}
        selected={item == selectedItem}
        highlighted={item == highlightedItem}
        scrollIntoView={this.scrollElementIntoViewIfNeeded}
        decoration={decoration}
      >
        {
          sortable && useDragHandle && <DragHandle />
        }
        {renderItem(item, index)}
      </ListItemContainer>
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
        <div className={styles.inner}>
          {
            !sortable && <ul className={styles.list} ref={this.setListContainer}>
              {
                items && items.map(this.renderListItem)
              }
            </ul>
          }
          {
            sortable && SortableList && (
              <SortableList
                sortableItems={items}
                onSortEnd={onSortEnd}
                onSortStart={onSortStart}
                onSortMove={onSortMove}
                helperClass={itemStyles.sortableHelper}
                transitionDuration={100}
                distance={0}
                axis="y"
                lockAxis="y"
                useDragHandle={useDragHandle}
                renderListItem={this.renderListItem}
                hideSortableGhost
              />
            )
          }
        </div>
      </div>
    )
  }
}
