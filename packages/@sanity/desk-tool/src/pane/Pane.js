import React, {PropTypes} from 'react'
import styles from '../../styles/Pane.css'
import Spinner from 'component:@sanity/components/loading/spinner'
import PaneMenu from './PaneMenu.js'
import IconHamburger from 'icon:@sanity/hamburger'

export default class Pane extends React.Component {

  static propTypes = {
    isActive: PropTypes.bool,
    loading: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func
  }

  constructor(...args) {
    super(...args)

    this.handleMenuOpen = this.handleMenuOpen.bind(this)
    this.handleMenuClose = this.handleMenuClose.bind(this)
    this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this)

    this.state = {
      menuOpened: false
    }
  }

  handleMenuOpen() {
    this.setState({
      menuOpened: true
    })
  }

  handleMenuClose() {
    this.setState({
      menuOpened: false
    })
  }

  handleMenuButtonClick() {
    this.handleMenuOpen()
  }

  render() {
    const {loading, items, renderItem, isActive} = this.props
    const {menuOpened} = this.state

    return (
      <div className={isActive ? styles.isActive : styles.pane}>
        <div className={styles.menuButton} onClick={this.handleMenuButtonClick}>
          {
            <IconHamburger />
          }

        </div>
        {
          menuOpened && <div className={styles.menu}>
            <PaneMenu opened onClickOutside={this.handleMenuClose} />
          </div>
        }

        <ul className={styles.paneItems}>
          {loading && <Spinner />}
          {items.map((item, i) => {
            return (
              <li className={styles.paneItem} key={item.key}>
                {renderItem(item, i)}
              </li>
            )
          })
          }
        </ul>
      </div>
    )
  }
}
