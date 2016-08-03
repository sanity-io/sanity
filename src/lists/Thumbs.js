import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/thumbs'
import Thumb from 'component:@sanity/components/lists/items/thumb'

export default class Thumbs extends React.Component {
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
    showInfo: PropTypes.bool
  }

  handleSelect(index) {
    this.props.onSelect(index)
  }


  render() {

    const {items, children, layout, className, scrollable, loading, showInfo} = this.props

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
              !children && items && items.map((item, i) => {
                return (
                  <li className={styles.item} key={i}>
                    <Thumb
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
                    </Thumb>
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
