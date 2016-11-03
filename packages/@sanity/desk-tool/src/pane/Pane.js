import React, {PropTypes} from 'react'
import styles from './styles/Pane.css'
import Spinner from 'part:@sanity/components/loading/spinner'
import PaneMenu from './PaneMenu.js'
import IconHamburger from 'part:@sanity/base/hamburger-icon'
import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'

export default class Pane extends React.Component {

  static propTypes = {
    isActive: PropTypes.bool,
    loading: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    contentType: PropTypes.oneOf(['types', 'documents']),
    onSetListView: PropTypes.func,
    onGetListView: PropTypes.func,
    type: PropTypes.string
  }

  static defaultProps = {
    isActive: false,
    onGetListView() {
      return 'default'
    }
  }

  constructor(...args) {
    super(...args)

    this.state = {
      menuOpened: false,
      view: 'list'
    }
  }

  handleMenuOpen = () => {
    this.setState({
      menuOpened: true
    })
  }

  handleMenuClose = () => {
    this.setState({
      menuOpened: false
    })
  }

  handleMenuAction = item => {
    if (item.action == 'setListView') {
      this.props.onSetListView(this.props.type, item.key)
    }

    this.handleMenuClose()
  }

  handleMenuButtonClick = () => {
    this.handleMenuOpen()
  }

  render() {
    const {loading, items, renderItem, isActive, contentType, type} = this.props
    const {menuOpened} = this.state

    const listView = this.props.onGetListView(type)

    return (
      <div
        className={`
          ${isActive ? styles.isActive : styles.isInactive}
          ${styles[`contentType--${this.props.contentType}`]}
          ${styles[`view--${listView}`]}
        `}
      >
        {
          contentType == 'documents'
          && <div className={styles.menuContainer}>
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
        {loading && <Spinner />}
        <div className={styles.listContainer}>

          {
            (listView == 'default' || listView == 'details')
            && <DefaultList items={items} renderItem={renderItem} />
          }

          {
            listView == 'thumbnails' && <GridList items={items} renderItem={renderItem} />
          }

          {
            listView == 'cards' && <GridList items={items} layout="masonry" renderItem={renderItem} />
          }

        </div>
      </div>
    )
  }
}
