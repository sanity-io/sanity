import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/menus/default'
import Ink from 'react-ink'
import enhanceWithClickOutside from 'react-click-outside'

class DefaultMenu extends React.Component {
  static propTypes = {
    onAction: PropTypes.func.isRequired,
    opened: PropTypes.bool,
    origin: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    ripple: PropTypes.bool,
    fullWidth: PropTypes.bool,
    className: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        id: PropTypes.string.isRequired,
        icon: PropTypes.node
      })
    )
  }

  static defaultProps = {
    menuOpened: false,
    origin: 'top-left',
    icon: false,
    ripple: true
  }

  constructor(props, context) {
    super(props, context)
    this.handleItemClick = this.handleItemClick.bind(this)
  }

  handleClickOutside() {
    this.setState({menuOpened: false})
  }

  handleItemClick(event) {
    // const actionId = event.currentTarget.getAttribute('data-action-id')
    this.props.onAction(
      // this.props.items.find(item => item.id === actionId)
      console.log('click')
    )
  }

  render() {
    const {items, origin, ripple, fullWidth, className} = this.props
    const originStyle = styles[`origin__${origin}`]

    return (
      <div className={`${this.props.opened ? styles.opened : styles.closed} ${originStyle} ${fullWidth && styles.fullWidth} ${className}`}>
        <ul className={styles.list}>
          {
            items.map((item, i) => {
              if (item.kind == 'divider') {
                return (
                  <li className={styles.divider}></li>
                )
              }
              const Icon = item.icon
              return (
                <li key={i} className={styles.item}>
                  <a onClick={this.handleItemClick} className={styles.link}>
                    {
                      Icon && <span className={styles.iconContainer}><Icon className={styles.icon} /></span>
                    }
                    {item.title}
                    {ripple && <Ink />}
                  </a>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
}

export default DefaultMenu
