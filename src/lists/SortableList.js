import React, {PropTypes} from 'react'
// import styles from 'part:@sanity/components/lists/default-style'
import ListItem from 'part:@sanity/components/lists/items/default'
import DefaultPreview from 'part:@sanity/components/previews/default'
import {SortableContainer, SortableElement} from 'react-sortable-hoc'
import DefaultList from 'part:@sanity/components/lists/default'

const SortableDefaultList = SortableContainer(DefaultList)
const SortableItem = SortableElement(ListItem)

export default class SortableList extends React.Component {
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
    scrollable: PropTypes.bool,
    selectable: PropTypes.bool,
    selectedItem: PropTypes.object,
    highlightedItem: PropTypes.object,
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    renderItem: PropTypes.func
  }

  static defaultProps = {
    onSelect() {},
    renderItem(item, i) {
      return (
        <DefaultPreview item={item} />
      )
    }
  }

  render() {
    return (
      <SortableDefaultList
        ListItemContainer={SortableItem}
        {...this.props}
      />
    )
  }
}
