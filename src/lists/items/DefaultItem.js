import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/default'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    index: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.node,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    onClick: PropTypes.func,
    layout: PropTypes.string,
    selected: PropTypes.bool
  }

  static defaultProps = {
    onClick() {},
    action() {}
  }

  constructor(context, props) {
    super(context, props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(index) {
    this.props.onClick(this.props.index)
  }

  render() {
    const {layout, title, icon, selected} = this.props
    const rootClasses = `
      ${styles[layout] || styles.root}
      ${selected ? styles.selected : styles.unSelected}
    `
    return (
      <li className={rootClasses} onClick={this.handleClick}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
      </li>
    )
  }
}
