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
    onSetSorting: PropTypes.func,
    listView: PropTypes.string,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    isActive: false,
    listView: 'default',
    onUpdate() {}
  }

  constructor(...args) {
    super(...args)

    this.state = {
      menuOpened: false,
      view: 'list'
    }
  }

  componentDidUpdate() {
    this.props.onUpdate()
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
      this.props.onSetListView(item.key)
    }

    if (item.action == 'setSorting') {
      this.props.onSetSorting(item.sorting)
    }

    this.handleMenuClose()
  }

  handleMenuButtonClick = () => {
    this.handleMenuOpen()
  }

  renderListView() {
    const {items, renderItem} = this.props

    const listView = this.props.listView

    switch (listView) { // eslint-disable-line default-case
      case 'thumbnail':
        return <GridList items={items} renderItem={renderItem} />

      case 'card':
        return <GridList items={items} layout="masonry" renderItem={renderItem} />

      case 'detail':
      case 'default':
        return <DefaultList items={items} renderItem={renderItem} />
    }
    console.error(new Error(`Invalid list view option: ${listView}`)) // eslint-disable-line no-console
    return <DefaultList items={items} renderItem={renderItem} />
  }

  render() {
    const {loading, isActive, contentType, listView} = this.props
    const {menuOpened} = this.state

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
          {this.renderListView()}
        </div>
      </div>
    )
  }
}
