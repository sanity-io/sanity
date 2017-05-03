import cls from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from './styles/DocumentsPane.css'
import PaneMenuContainer from './PaneMenuContainer'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import ListView from './ListView'

const NOOP = () => {}

export default withRouterHOC(class Pane extends React.PureComponent {
  static propTypes = {
    loading: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    getItemKey: PropTypes.func,
    onSetListLayout: PropTypes.func,
    onSetSorting: PropTypes.func,
    listLayout: PropTypes.oneOf(['default', 'media', 'cards', 'media']),
    type: PropTypes.shape({
      title: PropTypes.string
    }),
    router: PropTypes.shape({
      state: PropTypes.shape({
        selectType: PropTypes.string
      })
    })
  }

  static defaultProps = {
    listLayout: 'default',
    loading: false,
    published: [],
    drafts: [],
    onSetSorting: NOOP,
    onSetListLayout: NOOP
  }

  render() {
    const {
      loading,
      listLayout,
      items,
      type,
      router,
      onSetListLayout,
      onSetSorting,
      renderItem,
      getItemKey
    } = this.props

    const {selectedType, action, selectedDocumentId} = router.state

    const isActive = selectedType && !action && !selectedDocumentId
    const paneClasses = cls([
      isActive ? styles.isActive : styles.isInactive,
      styles[`list-layout--${listLayout}`]
    ])

    const hasDocuments = items.length > 0

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
            <Spinner center message="Loading items…"/>
          </div>
        )
        }

        {!loading && !hasDocuments && (
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
        )}

        {hasDocuments && (
          <ListView
            items={items}
            getItemKey={getItemKey}
            renderItem={renderItem}
            listLayout={listLayout}
          />
        )}
      </div>
    )
  }
})
