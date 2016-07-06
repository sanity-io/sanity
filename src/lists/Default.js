import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/default'
import ListItem from 'component:@sanity/components/list-items/default'

export default class DefaultList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        content: PropTypes.node,
        id: PropTypes.string,
        extraContent: PropTypes.node,
        icon: PropTypes.node
      })
    ),
    children: PropTypes.node,
    selectable: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string,
    layout: PropTypes.oneOf(['media', 'block', 'string'])
  }

  render() {

    const {items, children, layout} = this.props

    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <ul className={styles.list}>
            {
              !children && items && items.map(item => {
                return (
                  <ListItem layout={layout} key={item.id} title={item.title} icon={item.icon}>
                    {item.content}
                  </ListItem>
                )
              })
            }
            {children}
          </ul>
        </div>
      </div>
    )
  }
}
