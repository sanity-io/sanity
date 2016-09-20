import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/grid-style'
import GridItem from 'part:@sanity/components/lists/items/grid'

export default class GridList extends React.Component {
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
    selectable: PropTypes.bool,
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    square: PropTypes.bool,
    layout: PropTypes.oneOf(['media', 'block', 'string']),
    scrollable: PropTypes.bool,
    showInfo: PropTypes.bool,
    renderItem: PropTypes.func
  }

  handleSelect(index) {
    this.props.onSelect(index)
  }


  render() {

    const {items, children, layout, className, scrollable, loading, showInfo, renderItem} = this.props

    const rootStyle = `
      ${className}
      ${styles.root}
      ${scrollable && styles.isScrollable}
      ${loading && styles.isLoading}
    `

    return (
      <div className={rootStyle}>
        <div className={styles.inner}>
          <ul className={styles.list}>
            {
              renderItem && items && items.map((item, i) => {
                return (
                  <GridItem className={styles.item} key={i}>
                    {renderItem(item, i)}
                  </GridItem>
                )
              })
            }
            {
              !renderItem && !children && items && items.map((item, i) => {
                return (
                  <li className={styles.item} key={i}>
                    <GridItem
                      layout={layout}
                      key={i}
                      index={item.index}
                      title={item.title}
                      description={item.description}
                      image={item.image}
                      square={item.square}
                      onClick={this.handleSelect}
                      showInfo={showInfo}
                    >
                      {item.extraContent}
                    </GridItem>
                  </li>
                )
              })
            }
          </ul>
        </div>
      </div>
    )
  }
}
