import React from 'react'
import PropTypes from 'prop-types'
import {partition} from 'lodash'
import {withRouterHOC} from 'part:@sanity/base/router'
import schema from 'part:@sanity/base/schema'
import PlusIcon from 'part:@sanity/base/plus-icon'
import Button from 'part:@sanity/components/buttons/default'
import DefaultPane from 'part:@sanity/components/panes/default'
import QueryContainer from 'part:@sanity/base/query-container'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import {
  getPublishedId,
  isDraftId,
  isPublishedId,
  getDraftId
} from 'part:@sanity/base/util/draft-utils'

import NotPublishedStatus from '../components/NotPublishedStatus'
import DraftStatus from '../components/DraftStatus'
import styles from './styles/DocumentsListPane.css'
import listStyles from './styles/ListView.css'
import InfiniteList from './InfiniteList'
import PaneItem from './PaneItem'

function removePublishedWithDrafts(documents) {
  const [draftIds, publishedIds] = partition(documents.map(doc => doc._id), isDraftId)

  return documents
    .map(doc => ({
      ...doc,
      hasPublished: publishedIds.includes(getPublishedId(doc._id)),
      hasDraft: draftIds.includes(getDraftId(doc._id))
    }))
    .filter(doc => !(isPublishedId(doc._id) && doc.hasDraft))
}

function getDocumentKey(document) {
  return getPublishedId(document._id)
}

function noActionFn() {
  // eslint-disable-next-line no-console
  console.warn('No handler defined for action')
}

function isLiveEditEnabled(item) {
  return schema.get(item._type).liveEdit === true
}

function getStatusIndicator(item) {
  if (!item.hasPublished) {
    return NotPublishedStatus
  }

  if (!isLiveEditEnabled(item) && item.hasDraft && item.hasPublished) {
    return DraftStatus
  }

  return null
}

function getTypeNameFromSingleTypeFilter(filter, params = {}) {
  const pattern = /\b_type\s*==\s*(['"].*?['"]|\$.*?(?:\s|$))|\B(['"].*?['"]|\$.*?(?:\s|$))\s*==\s*_type\b/
  const matches = filter.match(pattern)
  if (!matches) {
    return null
  }

  const match = (matches[1] || matches[2]).trim().replace(/^["']|["']$/g, '')
  const typeName = match[0] === '$' ? params[match.slice(1)] : match
  return typeName || null
}

function toOrderClause(orderBy) {
  return orderBy
    .map(ordering =>
      [ordering.field, (ordering.direction || '').toLowerCase()]
        .map(str => str.trim())
        .filter(Boolean)
        .join(' ')
    )
    .join(', ')
}

const DEFAULT_ORDERING = [{field: '_createdAt', direction: 'desc'}]

export default withRouterHOC(
  class DocumentsListPane extends React.PureComponent {
    static propTypes = {
      index: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      className: PropTypes.string,
      styles: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      router: PropTypes.shape({
        state: PropTypes.shape({
          panes: PropTypes.arrayOf(PropTypes.string)
        })
      }).isRequired,
      defaultLayout: PropTypes.string,
      options: PropTypes.shape({
        filter: PropTypes.string.isRequired,
        defaultOrdering: PropTypes.arrayOf(
          PropTypes.shape({
            field: PropTypes.string.isRequired,
            direction: PropTypes.oneOf(['asc', 'desc'])
          })
        ),
        params: PropTypes.object // eslint-disable-line react/forbid-prop-types
      }).isRequired,
      menuItems: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired
        })
      ),
      menuItemGroups: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired
        })
      ),
      isSelected: PropTypes.bool.isRequired,
      isCollapsed: PropTypes.bool.isRequired,
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func
    }

    static defaultProps = {
      className: '',
      styles: {},
      menuItems: [],
      menuItemGroups: [],
      onExpand: undefined,
      onCollapse: undefined,
      defaultLayout: undefined
    }

    actionHandlers = {
      setLayout: ({layout}) => {
        this.setState({layout})
      },
      setSortOrder: ({by}) => {
        this.setState({sortBy: by})
      }
    }

    state = {scrollTop: 0}

    itemIsSelected(item) {
      const {router, index} = this.props
      const selected = (router.state.panes || [])[index] || ''
      return getPublishedId(item) === getPublishedId(selected)
    }

    getLinkStateForItem = id => {
      const {router, index} = this.props
      const panes = (router.state.panes || []).slice(0, index).concat(getPublishedId(id))
      return {panes}
    }

    renderItem = item => (
      <PaneItem
        id={item._id}
        getLinkState={this.getLinkStateForItem}
        layout={this.state.layout || this.props.defaultLayout || 'default'}
        value={item}
        status={getStatusIndicator(item)}
        schemaType={schema.get(item._type)}
        isSelected={this.itemIsSelected(item._id)}
      />
    )

    handleAction = item => {
      const handler =
        typeof item.action === 'function'
          ? item.action
          : this.actionHandlers[item.action] || noActionFn

      handler(item.params, this)
    }

    handleCreateNew = () => {
      const {options, router} = this.props
      const {filter, params} = options
      const typeName = getTypeNameFromSingleTypeFilter(filter, params)
      router.navigateIntent('create', {type: typeName})
    }

    handleScroll = scrollTop => {
      this.setState({scrollTop})
    }

    render() {
      const {
        title,
        options,
        className,
        isCollapsed,
        isSelected,
        onCollapse,
        onExpand,
        defaultLayout,
        menuItems,
        menuItemGroups
      } = this.props

      const {filter, params, defaultOrdering} = options
      const sortBy = this.state.sortBy || defaultOrdering || []
      const sort = sortBy.length > 0 ? sortBy : DEFAULT_ORDERING
      const layout = this.state.layout || defaultLayout || 'default'
      const typeName = getTypeNameFromSingleTypeFilter(filter, params)
      const hasItems = items => items && items.length > 0
      return (
        <DefaultPane
          title={title}
          className={className}
          styles={this.props.styles}
          scrollTop={this.state.scrollTop}
          menuItems={menuItems}
          menuItemGroups={menuItemGroups}
          isSelected={isSelected}
          isCollapsed={isCollapsed}
          onCollapse={onCollapse}
          onAction={this.handleAction}
          onExpand={onExpand}
        >
          <QueryContainer
            query={`*[${filter}] | order(${toOrderClause(sort)}) [0...50000] {_id, _type}`}
            params={params}
          >
            {({result, loading, error, onRetry}) => {
              if (error) {
                return (
                  <Snackbar kind="danger" action={{title: 'Retry'}} onAction={onRetry}>
                    <div>An error occurred while loading items:</div>
                    <div>{error.message}</div>
                  </Snackbar>
                )
              }

              const items = removePublishedWithDrafts(result ? result.documents : [])

              if (!loading && !hasItems(items)) {
                return (
                  <div className={styles.empty}>
                    <div>
                      <h3>
                        {typeName
                          ? 'No documents of this type found.'
                          : 'No documents matching this filter found.'}
                      </h3>

                      {typeName && (
                        <Button color="primary" icon={PlusIcon} onClick={this.handleCreateNew}>
                          New {schema.get(typeName).title}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div className={styles[`layout__${layout}`]}>
                  {loading && <Spinner center message="Loading items…" />}
                  {items && (
                    <InfiniteList
                      className={listStyles.scroll}
                      onScroll={this.handleScroll}
                      items={items}
                      layout={layout}
                      getItemKey={getDocumentKey}
                      renderItem={this.renderItem}
                    />
                  )}
                </div>
              )
            }}
          </QueryContainer>
        </DefaultPane>
      )
    }
  }
)
