import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/default-style'
import ListItem from 'part:@sanity/components/lists/items/default'
import ReactDOM from 'react-dom'
import DefaultPreview from 'part:@sanity/components/previews/default'

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
    scrollable: PropTypes.bool,
    selectable: PropTypes.bool,
    selectedItem: PropTypes.object,
    highlightedItem: PropTypes.object,
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    renderItem: PropTypes.func,
    ListItemContainer: PropTypes.func,
    decoration: PropTypes.string
  }

  static defaultProps = {
    onSelect() {},
    renderItem(item, i) {
      return (
        <DefaultPreview item={item} />
      )
    }
  }

  constructor(context, props) {
    super(context, props)

    this.handleSelect = this.handleSelect.bind(this)
    this.setListContainer = this.setListContainer.bind(this)
    this.scrollElementIntoViewIfNeeded = this.scrollElementIntoViewIfNeeded.bind(this)
  }

  handleSelect(item) {
    this.props.onSelect(item)
  }

  setListContainer(element) {
    this._listContainer = element
  }

  scrollElementIntoViewIfNeeded(domNode) {
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

  render() {

    const {items, className, selectedItem, highlightedItem, renderItem, scrollable, decoration} = this.props

    const ListItemContainer = this.props.ListItemContainer || ListItem

    return (
      <div className={`${scrollable ? styles.scrollable : styles.root} ${className} `}>
        <div className={styles.inner}>
          <ul className={styles.list} ref={this.setListContainer}>
            {
              renderItem && items && items.map((item, i) => {
                return (
                  <ListItemContainer
                    className={styles.item}
                    index={item.index}
                    key={`item-${i}`}
                    item={item}
                    onSelect={this.handleSelect}
                    selected={item == selectedItem}
                    highlighted={item == highlightedItem}
                    scrollIntoView={this.scrollElementIntoViewIfNeeded}
                    decoration={decoration}
                  >
                    {renderItem(item, i)}
                  </ListItemContainer>
                )
              })
            }
          </ul>
        </div>
      </div>
    )
  }
}
