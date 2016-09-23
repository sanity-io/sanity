import React, {PropTypes} from 'react'
import styles from './styles/Pane.css'
import Spinner from 'part:@sanity/components/loading/spinner'
import PaneMenu from './PaneMenu.js'
import PaneItem from './PaneItem.js'
import IconHamburger from 'part:@sanity/base/hamburger-icon'

export default class Pane extends React.Component {

  static propTypes = {
    isActive: PropTypes.bool,
    loading: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    contentType: PropTypes.oneOf(['types', 'documents'])
  }

  constructor(...args) {
    super(...args)

    this.handleMenuOpen = this.handleMenuOpen.bind(this)
    this.handleMenuClose = this.handleMenuClose.bind(this)
    this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this)
    this.handleMenuAction = this.handleMenuAction.bind(this)

    this.state = {
      menuOpened: false,
      view: 'list'
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

  handleMenuAction(item) {
    switch (item.index) {
      case 'showDetails':
        this.setState({view: 'details'})
        break
      case 'showThumbnails':
        this.setState({view: 'thumbnails'})
        break
      case 'showList':
        this.setState({view: 'list'})
        break
      default:
        this.setState({view: 'list'})
    }
    this.handleMenuClose()
  }

  handleMenuButtonClick() {
    this.handleMenuOpen()
  }

  render() {
    const {loading, items, renderItem, isActive, contentType} = this.props
    const {menuOpened} = this.state

    return (
      <div
        className={`
          ${isActive ? styles.isActive : styles.isDisabled}
          ${styles[`contentType--${this.props.contentType}`]}
          ${this.state.view == 'list' ? styles.list : ''}
          ${this.state.view == 'thumbnails' ? styles.thumbnails : ''}
          ${this.state.view == 'details' ? styles.details : ''}
        `}
      >
        {
          contentType == 'documents'
          && <div>
            <div className={styles.menuButton} onClick={this.handleMenuButtonClick}>
              {
                <IconHamburger />
              }
            </div>
            <div className={styles.menu}>
              <PaneMenu
                opened={menuOpened}
                onClickOutside={this.handleMenuClose}
                onAction={this.handleMenuAction}
              />
            </div>
          </div>
        }

        <ul className={styles.items}>
          {loading && <Spinner />}
          {items.map((item, i) => {
            return (
              <PaneItem key={item.key} view={this.state.view} item={item} renderItem={renderItem} index={i} />
            )
          })
          }
        </ul>
      </div>
    )
  }
}
