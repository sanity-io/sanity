import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/default'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.node,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    layout: PropTypes.string,
    selected: PropTypes.bool
  }
  render() {
    const {layout, title, icon, selected} = this.props
    const rootClasses = `
      ${styles[layout] || styles.root}
      ${selected ? styles.selected : styles.unSelected}
    `
    return (
      <div className={rootClasses}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
      </div>
    )
  }
}
