import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/grid-style'
import MediaPreview from 'part:@sanity/components/previews/media'
import {ContainerQuery} from 'react-container-query'
import classnames from 'classnames'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'
import GridListItem from 'part:@sanity/components/lists/items/grid'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import itemStyles from 'part:@sanity/components/lists/items/grid-style'
import ListItemWrapper from './items/ListItemWrapper'
import {item as itemPropType} from './PropTypes'
import detectIt from 'detect-it'

const DragHandle = SortableHandle(() => <span className={itemStyles.dragHandle}><DragBarsIcon /></span>)

const SortableItem = SortableElement(({value, index, renderListItem, props}) => {
  return renderListItem(value, props, index)
})

const SortableList = SortableContainer(({sortableItems, renderListItem, getItemKey, className, ref}) => {
  return (
    <ul className={`${styles.sortableList} ${className}`} ref={ref}>
      {
        sortableItems.map((value, index) => {
          return (
            <SortableItem
              key={getItemKey(value, index)}
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
    items: PropTypes.arrayOf(itemPropType),
    useDragHandle: PropTypes.bool,

    scrollable: PropTypes.bool,
    selectable: PropTypes.bool,
    sortable: PropTypes.bool,

    selectedItem: itemPropType,
    highlightedItem: itemPropType,
    focusedItem: itemPropType,
    loading: PropTypes.bool,
    className: PropTypes.string,

    renderItem: PropTypes.func,
    getItemKey: PropTypes.func,

    decoration: PropTypes.string,
    onOpen: PropTypes.func,
    onSelect: PropTypes.func,
    onSortStart: PropTypes.func,
    onSortMove: PropTypes.func,
    onSortEnd: PropTypes.func,

    showInfo: PropTypes.bool,
    square: PropTypes.bool,
    layout: PropTypes.oneOf(['masonry']),
    containerQuery: PropTypes.object
  }

  static defaultProps = {
    onSelect() {},
    onOpen() {},
    renderItem(item, i) {
      return (
        <MediaPreview item={item} />
      )
    },
    getItemKey(item, index) {
      return `list-item-${index}`
    }
  }

  state = {
    hasTouch: false
  }

  componentDidMount() {
    this.setState({
      hasTouch: detectIt.hasTouch
    })
  }

  renderListItem = (item, index) => {

    const {
      renderItem,
      getItemKey,
      decoration,
      selectedItem,
      highlightedItem,
      focusedItem,
      sortable,
      useDragHandle,
      onSelect,
      onOpen
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
        onOpen={onOpen}
        selected={item == selectedItem}
        highlighted={item == highlightedItem}
        decoration={decoration}
        scrollIntoView={this.scrollElementIntoViewIfNeeded}
      >
        {
          sortable && useDragHandle && <DragHandle />
        }

        <GridListItem
          key={key}
          item={item}
          onSelect={onSelect}
          onOpen={onOpen}
          selected={isSelected}
          focus={hasFocus}
        >
          {renderedItem}
        </GridListItem>
      </ListItemWrapper>
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
      getItemKey,
      onSortEnd
    } = this.props

    const {hasTouch} = this.state

    const rootStyle = classnames([
      layout == 'masonry' ? styles.masonry : styles.default,
      scrollable && styles.isScrollable,
      sortable && styles.isSortable,
      loading && styles.isLoading,
      className
    ])

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
                sortable && (
                  <SortableList
                    sortableItems={items}
                    onSortEnd={onSortEnd}
                    onSortStart={onSortStart}
                    onSortMove={onSortMove}
                    className={scrollable ? styles.scrollableList : styles.list}
                    helperClass={itemStyles.sortableHelper}
                    transitionDuration={100}
                    pressDelay={hasTouch ? 200 : 0}
                    distance={hasTouch ? 0 : 1}
                    axis="xy"
                    useDragHandle={useDragHandle}
                    renderListItem={this.renderListItem}
                    getItemKey={getItemKey}
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
