import React, {PropTypes} from 'react'
import PaneMenu from './PaneMenu.js'
import IconHamburger from 'part:@sanity/base/hamburger-icon'
import Button from 'part:@sanity/components/buttons/default'
import clickOutsideEnhancer from 'react-click-outside'
import styles from './styles/Pane.css'

class PaneMenuContainer extends React.PureComponent {
  static propTypes = {
    onSetListLayout: PropTypes.func,
    onSetSorting: PropTypes.func
  }

  constructor(...args) {
    super(...args)
    this.state = {menuOpened: false}
  }

  handleClickOutside = () => {
    if (this.state.menuOpened) {
      this.setState({menuOpened: false})
    }
  }

  handleMenuToggle = () => {
    this.setState({menuOpened: !this.state.menuOpened})
  }

  handleMenuClose = () => {
    if (this.state.menuOpened) {
      this.setState({menuOpened: false})
    }
  }

  handleMenuAction = item => {
    if (item.action === 'setListLayout') {
      this.props.onSetListLayout(item.key)
    }

    if (item.action === 'setSorting') {
      this.props.onSetSorting(item.sorting)
    }

    this.handleMenuClose()
  }

  render() {
    const {menuOpened} = this.state
    return (
      <div className={styles.menuContainer}>
        <div className={styles.menuButton}>
          <Button kind="simple" onClick={this.handleMenuToggle}>
            <IconHamburger />
          </Button>
        </div>

        <div className={styles.menu}>
          <PaneMenu
            opened={menuOpened}
            onAction={this.handleMenuAction}
          />
        </div>
      </div>
    )
  }
}

export default clickOutsideEnhancer(PaneMenuContainer)
