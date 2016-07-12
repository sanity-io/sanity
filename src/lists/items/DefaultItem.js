import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/default'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.node,
    key: PropTypes.string.isRequired,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    action: PropTypes.func,
    onClick: PropTypes.func,
    layout: PropTypes.string
  }

  static defaultProps = {
    onClick() {},
    action() {}
  }

  constructor(context, props) {
    super(context, props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(id) {
    console.log('id', this.props.id)
    this.props.onClick(this.props.id)
    this.props.action()
  }

  render() {
    const {layout, title, icon} = this.props
    return (
      <li className={`${styles[layout] || styles.root}`} onClick={this.handleClick}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
      </li>
    )
  }
}
