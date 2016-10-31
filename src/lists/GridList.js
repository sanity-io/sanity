import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/grid-style'
import ListItem from 'part:@sanity/components/lists/items/default'
import MediaPreview from 'part:@sanity/components/previews/media'

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
    className: PropTypes.string,
    square: PropTypes.bool,
    layout: PropTypes.oneOf(['masonry']),
    scrollable: PropTypes.bool,
    showInfo: PropTypes.bool,
    renderItem: PropTypes.func
  }

  static defaultProps = {
    onSelect() {},
    renderItem(item, i) {
      return (
        <MediaPreview item={item} />
      )
    }
  }

  handleSelect(index) {
    this.props.onSelect(index)
  }


  render() {

    const {items, layout, className, scrollable, loading, renderItem} = this.props

    const rootStyle = `
      ${className}
      ${layout == 'masonry' ? styles.masonry : styles.default}
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
                  <ListItem className={styles.item} key={i} item={item}>
                    {renderItem(item, i)}
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
