import cls from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import GridList from 'part:@sanity/components/lists/grid'
import styles from './styles/Pane.css'
import PaneMenuContainer from './PaneMenuContainer'
import {find} from 'lodash'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'

export default withRouterHOC(class Pane extends React.PureComponent {

  static propTypes = {
    loading: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    getItemKey: PropTypes.func,
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
    const {items, renderItem, router, listLayout, getItemKey} = this.props
    const {selectedDocumentId} = router.state

    const selectedItem = find(items, item => item._id == selectedDocumentId)


    switch (listLayout) { // eslint-disable-line default-case
      case 'media':
        return (
          <GridList
            overrideItemRender
            items={items}
            getItemKey={getItemKey}
            renderItem={renderItem}
            selectedItem={selectedItem}
            onSelect={this.handleSelect}
          />
        )

      case 'card':
        return (
          <GridList
            overrideItemRender
            items={items}
            getItemKey={getItemKey}
            layout="masonry"
            renderItem={renderItem}
            selectedItem={selectedItem}
            onSelect={this.handleSelect}
          />
        )

      case 'detail':
      case 'default':
      default:
        if (listLayout !== 'detail' && listLayout !== 'default') {
          console.error(new Error(`Invalid list view option: ${listLayout}`)) // eslint-disable-line no-console
        }
        return items.map((item, i) => {
          return (
            <div key={i}>
              {renderItem(item, i, {})}
            </div>
          )
        })
    }
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
    const paneClasses = cls([
      isActive ? styles.isActive : styles.isInactive,
      styles[`list-layout--${listLayout}`]
    ])

    return (
      <div className={paneClasses}>
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
          items && !loading && items.length == 0 && (
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
