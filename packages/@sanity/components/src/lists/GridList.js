import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/grid-style'
import ListItem from 'part:@sanity/components/lists/items/grid'
import MediaPreview from 'part:@sanity/components/previews/media'
import {ContainerQuery} from 'react-container-query'
import classnames from 'classnames'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import itemStyles from 'part:@sanity/components/lists/items/grid-style'

const DragHandle = SortableHandle(() => <span className={itemStyles.dragHandle}><DragBarsIcon /></span>)


const SortableItem = SortableElement(({value, index, renderListItem, props}) => {
  return renderListItem(value, props, index)
})

const SortableList = SortableContainer(({sortableItems, renderListItem, className, ref}) => {
  return (
    <ul className={`${styles.sortableList} ${className}`} ref={ref}>
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

class GridList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        content: PropTypes.node,
        index: PropTypes.string,
        image: PropTypes.string
      })
    ),
    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    selectable: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string,
    square: PropTypes.bool,
    layout: PropTypes.oneOf(['masonry']),
    scrollable: PropTypes.bool,
    showInfo: PropTypes.bool,
    renderItem: PropTypes.func,
    containerQuery: PropTypes.object,
    ListItemContainer: PropTypes.func,
    sortable: PropTypes.bool,
    decoration: PropTypes.string,
    useDragHandle: PropTypes.bool,
    onSortStart: PropTypes.func,
    onSortMove: PropTypes.func,
    onSortEnd: PropTypes.func,
    selectedItem: PropTypes.object,
    highlightedItem: PropTypes.object,
  }

  static defaultProps = {
    onSelect() {},
    onOpen() {},
    renderItem(item, i) {
      return (
        <MediaPreview item={item} />
      )
    }
  }

  renderListItem = (item, index) => {

    const {
      ListItemContainer = ListItem,
      renderItem,
      decoration,
      selectedItem,
      highlightedItem,
      sortable,
      useDragHandle,
      onSelect,
      onOpen
    } = this.props

    return (
      <ListItemContainer
        className={styles.item}
        index={item.index}
        key={`item-${index}`}
        item={item}
        onSelect={onSelect}
        onOpen={onOpen}
        selected={item == selectedItem}
        highlighted={item == highlightedItem}
        decoration={decoration}
        scrollIntoView={this.scrollElementIntoViewIfNeeded}
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
      layout,
      className,
      scrollable,
      loading,
      sortable,
      useDragHandle,
      onSortStart,
      onSortMove,
      onSortEnd
    } = this.props

    const rootStyle = `
      ${layout == 'masonry' ? styles.masonry : styles.default}
      ${scrollable ? styles.isScrollable : ''}
      ${sortable ? styles.isSortable : ''}
      ${loading ? styles.isLoading : ''}
      ${className}
    `

    const query = {
      [styles.containerQuery__small]: {
        minWidth: 0,
        maxWidth: 480
      },
      [styles.containerQuery__medium]: {
        minWidth: 481,
        maxWidth: 1000,
      },
      [styles.containerQuery__large]: {
        minWidth: 1001,
      }
    }

    return (
      <ContainerQuery query={query}>
        {params => (
          <div className={`${rootStyle} ${classnames(params)}`}>
            <div className={styles.inner}>
              {
                !sortable && <ul className={scrollable ? styles.scrollableList : styles.list} ref={this.setListElement}>
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
                    className={scrollable ? styles.scrollableList : styles.list}
                    helperClass={itemStyles.sortableHelper}
                    transitionDuration={100}
                    distance={0}
                    axis="xy"
                    useDragHandle={useDragHandle}
                    renderListItem={this.renderListItem}
                    ref={this.setListElement}
                    hideSortableGhost
                  />
                )
              }
            </div>
          </div>
        )}

      </ContainerQuery>
    )
  }
}

export default GridList
