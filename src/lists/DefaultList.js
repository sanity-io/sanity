import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/default-style'
import ListItem from 'part:@sanity/components/lists/items/default'
import BlankListItem from 'part:@sanity/components/lists/items/blank'
import ReactDOM from 'react-dom'

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
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    layout: PropTypes.oneOf(['media', 'block', 'string']),
    renderItem: PropTypes.func
  }

  static defaultProps = {
    selectedItemIndex: null
  }

  constructor(context, props) {
    super(context, props)

    this.handleSelect = this.handleSelect.bind(this)
    this.setListContainer = this.setListContainer.bind(this)
    this.scrollElementIntoViewIfNeeded = this.scrollElementIntoViewIfNeeded.bind(this)
  }

  handleSelect(event) {
    const itemIndex = event.currentTarget.getAttribute('data-item-index')
    this.props.onSelect(this.props.items[itemIndex])
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

    const {items, layout, className, selectedItem, renderItem, scrollable} = this.props

    return (
      <div className={`${scrollable ? styles.scrollable : styles.root} ${className} `}>
        <div className={styles.inner}>
          <ul className={styles.list} ref={this.setListContainer}>

            {
              renderItem && items && items.map((item, i) => {
                return (
                  <BlankListItem className={styles.item} key={i}>
                    {renderItem(item, i)}
                  </BlankListItem>
                )
              })
            }

            {
              !renderItem && items && items.map((item, i) => {
                return (
                  <ListItem
                    layout={layout}
                    title={item.title}
                    icon={item.icon}
                    selected={selectedItem == item}
                    key={i}
                    index={`${i}`}
                    onSelect={this.handleSelect}
                    className={styles.item}
                    scrollIntoView={this.scrollElementIntoViewIfNeeded}
                  >
                    {item.content}
                  </ListItem>
                )
              })
            }
          </ul>
        </div>
      </div>
    )
  }
}
