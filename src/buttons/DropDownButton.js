import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/buttons/dropwdown'
import Button from 'component:@sanity/components/buttons/default'
import enhanceWithClickOutside from 'react-click-outside'

class DropDownButton extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['add', 'delete', 'warning', 'success', 'danger']),
    items: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      icon: PropTypes.string
    })),
    children: PropTypes.node.isRequired,
    inverted: PropTypes.bool,
    icon: PropTypes.node,
    loading: PropTypes.bool,
    ripple: PropTypes.bool,
    colored: PropTypes.bool,
    color: PropTypes.string // success, warning, danger, info
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      menuOpened: false
    }
    this.handleOnClick = this.handleOnClick.bind(this)
  }

  handleClickOutside() {
    this.setState({menuOpened: false})
  }

  handleOnClick() {
    this.setState({
      menuOpened: !this.state.menuOpened
    })
  }

  render() {
    const {items} = this.props

    return (
      <Button
        className={styles.root}
        onClick={this.handleOnClick}
        {...this.props}
      >
        <span className={styles.title}>
          Dropdown {this.props.children}
        </span>

        <span className={styles.arrow}></span>

        <ul className={this.state.menuOpened ? styles.menuOpened : styles.menuClosed}>
          {
            items.map((item, i) => {
              return (
                <li key={i} className={styles.menuItem}>
                  <a onClick={item.onClick} className={styles.menuItemLink}>
                    {item.title}
                  </a>
                </li>
              )
            })
          }

        </ul>
      </Button>
    )
  }
}

export default enhanceWithClickOutside(DropDownButton)
