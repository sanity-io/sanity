import React, {PropTypes} from 'react'
import styles from './styles/Pane.css'
import Spinner from 'part:@sanity/components/loading/spinner'
import PaneMenu from './PaneMenu.js'
import IconHamburger from 'part:@sanity/base/hamburger-icon'
import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'
import Button from 'part:@sanity/components/buttons/default'
import UrlDocId from '../utils/UrlDocId'

export default class Pane extends React.Component {

  static propTypes = {
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
    listView: 'default',
    onUpdate() {}
  }

  static contextTypes = {
    router: PropTypes.object
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

  handleMenuToggle = () => {
    this.setState({
      menuOpened: !this.state.menuOpened
    })
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
    this.handleMenuToggle()
  }

  handleMenuButtonMouseOver = event => {
    event.preventDefault()
    event.stopPropagation()
  }

  handleSelect = item => {
    const {router} = this.context
    const {selectedType} = this.context.router.state

    router.navigate({selectedType, action: 'edit', selectedDocumentId: UrlDocId.encode(item._id)})
  }

  renderListView() {
    const {items, renderItem} = this.props

    const listView = this.props.listView

    switch (listView) { // eslint-disable-line default-case
      case 'media':
        return <GridList items={items} renderItem={renderItem} onSelect={this.handleSelect} />

      case 'card':
        return <GridList items={items} layout="masonry" renderItem={renderItem} onSelect={this.handleSelect} />

      case 'detail':
      case 'default':
        return <DefaultList items={items} renderItem={renderItem} onSelect={this.handleSelect} />
    }
    console.error(new Error(`Invalid list view option: ${listView}`)) // eslint-disable-line no-console
    return <DefaultList items={items} renderItem={renderItem} onSelect={this.handleSelect} />
  }

  render() {
    const {loading, listView} = this.props
    const {menuOpened} = this.state

    const {router} = this.context
    const {selectedType, action, selectedDocumentId} = router.state

    const isActive = selectedType && !action && !selectedDocumentId

    return (
      <div
        className={`
          ${isActive ? styles.isActive : styles.isInactive}
          ${styles[`contentType--${this.props.contentType}`]}
          ${styles[`view--${listView}`]}
        `}
      >
        <div className={styles.menuContainer}>
          <div className={styles.menuButton}>
            <Button kind="simple" onClick={this.handleMenuButtonClick}>
              <IconHamburger />
            </Button>
          </div>
          <div className={styles.menu}>
            <PaneMenu
              opened={menuOpened}
              onClickOutside={this.handleMenuClose}
              onAction={this.handleMenuAction}
            />
          </div>
        </div>
        {loading && <Spinner />}
        <div className={styles.listContainer}>
          {this.renderListView()}
        </div>
      </div>
    )
  }
}
