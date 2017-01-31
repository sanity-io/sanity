import React, {PropTypes} from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'
import UrlDocId from '../utils/UrlDocId'
import styles from './styles/Pane.css'
import PaneMenuContainer from './PaneMenuContainer'
import {find} from 'lodash'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'

export default withRouterHOC(class Pane extends React.PureComponent {

  static propTypes = {
    loading: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    onSetListLayout: PropTypes.func,
    onSetSorting: PropTypes.func,
    listLayout: PropTypes.string,
    type: PropTypes.object,
    onSelect: PropTypes.func,
    router: PropTypes.shape({
      state: PropTypes.object
    })
  }

  static defaultProps = {
    listLayout: 'default',
    onSelect() {}
  }

  handleSelect = item => {
    this.props.onSelect(item)
    return false
  }

  renderListView() {
    const {items, renderItem, router, listLayout} = this.props
    const {selectedDocumentId} = router.state

    const selectedItem = find(items, item => {
      return UrlDocId.encode(item._id) == selectedDocumentId
    })


    switch (listLayout) { // eslint-disable-line default-case
      case 'media':
        return <GridList items={items} renderItem={renderItem} selectedItem={selectedItem} onSelect={this.handleSelect} />

      case 'card':
        return <GridList items={items} layout="masonry" renderItem={renderItem} selectedItem={selectedItem} onSelect={this.handleSelect} />

      case 'detail':
      case 'default':
        return <DefaultList items={items} renderItem={renderItem} selectedItem={selectedItem} onSelect={this.handleSelect} />
    }

    console.error(new Error(`Invalid list view option: ${listLayout}`)) // eslint-disable-line no-console
    return <DefaultList items={items} renderItem={renderItem} selectedItem={selectedItem} onSelect={this.handleSelect} />
  }

  render() {
    const {
      loading,
      listLayout,
      items,
      type,
      router,
      onSetListLayout,
      onSetSorting
    } = this.props

    const {selectedType, action, selectedDocumentId} = router.state

    const isActive = selectedType && !action && !selectedDocumentId

    return (
      <div
        className={`
          ${isActive ? styles.isActive : styles.isInactive}
          ${styles[`list-layout--${listLayout}`]}
        `}
      >
        <div className={styles.top}>
          <div className={styles.heading}>
            {type.title}
          </div>
          <PaneMenuContainer
            onSetListLayout={onSetListLayout}
            onSetSorting={onSetSorting}
          />
        </div>

        {loading && (
          <div className={styles.spinner}>
            <Spinner center message="Loading items…" />
          </div>
          )
        }

        {
          items && items.length == 0 && (
            <div className={styles.empty}>
              <h3>Nothing here. Yet…</h3>
              <StateLink
                className={styles.emptyCreateNew}
                title={`Create new ${type.title}`}
                state={{selectedType: type.name, action: 'create'}}
              >
                  Create new {type.title}
              </StateLink>
            </div>
          )
        }

        <div className={styles.listContainer}>
          {this.renderListView()}
        </div>
      </div>
    )
  }
})
