import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/menus/default-style'
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
    onClickOutside: PropTypes.func,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func
      })
    )
  }

  static defaultProps = {
    menuOpened: false,
    origin: 'top-left',
    icon: false,
    ripple: true,
    onClickOutside() {}
  }

  handleClickOutside = () => {
    this.props.onClickOutside()
  }

  handleItemClick = event => {
    const actionId = event.currentTarget.getAttribute('data-action-id')
    this.props.onAction(this.props.items[actionId])
  }

  render() {
    const {items, origin, ripple, fullWidth, className} = this.props
    const originStyle = styles[`origin__${origin}`]

    return (
      <div className={`${this.props.opened ? styles.opened : styles.closed} ${originStyle} ${fullWidth && styles.fullWidth} ${className}`}>
        <ul className={styles.list}>
          {
            items.map((item, i) => {
              const Icon = item.icon
              return (
                <li key={i} className={`${styles.item} ${item.divider && styles.divider}`}>
                  <a
                    onClick={this.handleItemClick}
                    data-action-id={i}
                    className={styles.link}
                  >
                    {
                      Icon && <span className={styles.iconContainer}><Icon className={styles.icon} /></span>
                    }
                    {item.title}
                    {
                      ripple && <Ink />
                    }
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

export default enhanceWithClickOutside(DefaultMenu)
