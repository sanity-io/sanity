import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/buttons/dropdown'
import Button from 'component:@sanity/components/buttons/default'
import ArrowIcon from 'icon:@sanity/angle-down'

class DropDownButton extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['secondary', 'add', 'delete', 'warning', 'success', 'danger']),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func
      })
    ),
    onAction: PropTypes.func.isRequired,
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

        <span className={styles.arrow}>
          <ArrowIcon color="inherit" />
        </span>
        {
          // <Menu
          //   items={items}
          //   opened={this.state.menuOpened}
          //   fullWidth
          //   className={styles.menu}
          //   onAction={this.handleAction}
          // />
        }
      </Button>
    )
  }
}

export default DropDownButton
