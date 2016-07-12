import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/default'
import ListItem from 'component:@sanity/components/lists/items/default'

export default class DefaultList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        content: PropTypes.node,
        key: PropTypes.string,
        extraContent: PropTypes.node,
        icon: PropTypes.node
      })
    ),
    onSelect: PropTypes.func,
    selectable: PropTypes.bool,
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    layout: PropTypes.oneOf(['media', 'block', 'string'])
  }

  constructor(context, props) {
    super(context, props)
  }

  render() {

    const {items, children, layout, className} = this.props

    return (
      <div className={`${className} ${styles.root}`}>
        <div className={styles.inner}>
          <ul className={styles.list}>
            {
              !children && items && items.map((item, i) => {
                return (
                  <ListItem layout={layout} key={i} id={item.id} title={item.title} icon={item.icon} onClick={this.props.onSelect}>
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
