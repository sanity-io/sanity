import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/buttons/dropdown'
import Button from 'component:@sanity/components/buttons/default'
// import enhanceWithClickOutside from 'react-click-outside'
import Menu from 'component:@sanity/components/menus/default'

class DropDownButton extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['add', 'delete', 'warning', 'success', 'danger']),
    items: Menu.propTypes.items,
    onAction: Menu.propTypes.onAction,
    children: PropTypes.node.isRequired,
    inverted: PropTypes.bool,
    icon: PropTypes.node,
    loading: PropTypes.bool,
    ripple: PropTypes.bool,
    colored: PropTypes.bool,
    color: PropTypes.string
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      menuOpened: false
    }
    this.handleOnClick = this.handleOnClick.bind(this)
    this.handleAction = this.handleAction.bind(this)
  }

  handleClickOutside() {
    this.setState({menuOpened: false})
  }

  handleOnClick() {
    this.setState({
      menuOpened: !this.state.menuOpened
    })
  }
  handleAction(item) {
    this.props.onAction(item)
  }

  render() {
    const {items} = this.props

    return (
      <Button
        className={styles.root}
        onClick={this.handleOnClick}
      >
        <span className={styles.title}>
          {this.props.children}
        </span>

        <span className={styles.arrow}></span>

        <Menu
          items={items}
          opened={this.state.menuOpened}
          fullWidth
          className={styles.menu}
          onAction={this.handleAction}
        />

      </Button>
    )
  }
}

export default DropDownButton
