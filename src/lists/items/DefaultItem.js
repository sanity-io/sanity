import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/default'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    content: PropTypes.node,
    id: PropTypes.string,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    action: PropTypes.func,
    layout: PropTypes.string
  }

  render() {
    const {layout, title, icon, action} = this.props
    return (
      <li className={`${styles[layout] || styles.root}`} onClick={action}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
      </li>
    )
  }
}
