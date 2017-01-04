import React, {PropTypes} from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'
import UrlDocId from '../utils/UrlDocId'
import styles from './styles/Pane.css'
import PaneMenuContainer from './PaneMenuContainer'

export default class Pane extends React.PureComponent {

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
    listView: 'default'
  }

  static contextTypes = {
    router: PropTypes.object
  }

  componentDidUpdate() {
    if (this.props.onUpdate) {
      this.props.onUpdate()
    }
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
        <PaneMenuContainer
          styles={styles}
          onSetListView={this.props.onSetListView}
          onSetSorting={this.props.onSetSorting}
        />

        {loading && <Spinner />}

        <div className={styles.listContainer}>
          {this.renderListView()}
        </div>
      </div>
    )
  }
}
