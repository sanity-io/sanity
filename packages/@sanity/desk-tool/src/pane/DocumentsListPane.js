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
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'

import {combineLatest} from 'rxjs'
import settings from '../settings'
import styles from './styles/DocumentsListPane.css'
import listStyles from './styles/ListView.css'
import InfiniteList from './InfiniteList'
import PaneItem from './PaneItem'
import {map, tap} from 'rxjs/operators'

const DEFAULT_ORDERING = [{field: '_createdAt', direction: 'desc'}]

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

function isSimpleTypeFilter(filter) {
  return /^_type\s*==\s*['"$]\w+['"]?\s*$/.test(filter.trim())
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
      displayOptions: PropTypes.shape({
        showIcons: PropTypes.bool
      }),
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
      displayOptions: {},
      onExpand: undefined,
      onCollapse: undefined,
      defaultLayout: undefined
    }

    actionHandlers = {
      setLayout: ({layout}) => {
        this.layoutSetting.set(layout)
      },
      setSortOrder: sort => {
        this.sortOrderSetting.set(sort)
      }
    }

    state = {scrollTop: 0, sortOrder: null, layout: null}

    constructor(props) {
      super()
      const {filter, params} = props.options
      const typeName = getTypeNameFromSingleTypeFilter(filter, params)
      const settingsNamespace = settings.forNamespace(typeName)
      this.sortOrderSetting = settingsNamespace.forKey('sortOrder')
      this.layoutSetting = settingsNamespace.forKey('layout')

      let sync = true
      this.settingsSubscription = combineLatest(
        this.sortOrderSetting.listen(DEFAULT_ORDERING),
        this.layoutSetting.listen()
      )
        .pipe(
          map(([sortOrder, layout]) => ({
            sortOrder,
            layout
          })),
          tap(nextState => {
            if (sync) {
              this.state = nextState
            } else {
              this.setState(nextState)
            }
          })
        )
        .subscribe()

      sync = false
    }

    componentWillUnmount() {
      this.settingsSubscription.unsubscribe()
    }

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
        icon={this.props.displayOptions.showIcons === false ? false : undefined}
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

    buildListQuery() {
      const {options} = this.props
      const {filter, defaultOrdering} = options
      const sortState = this.state.sortOrder
      const extendedProjection = sortState && sortState.extendedProjection
      const projectionFields = ['_id', '_type']
      const finalProjection = projectionFields.join(', ')
      const sortBy = (sortState && sortState.by) || defaultOrdering || []
      const sort = sortBy.length > 0 ? sortBy : DEFAULT_ORDERING

      if (extendedProjection) {
        const firstProjection = projectionFields.concat(extendedProjection).join(', ')
        // At first glance, you might think that 'order' should come before 'slice'?
        // However, this is actullay a counter-bug
        // to https://github.com/sanity-io/gradient/issues/922 which causes:
        // 1. case-insensitive ordering (we want this)
        // 2. null-values to sort to the top, even when order is desc (we don't want this)
        // Because Studios in the wild rely on the buggy nature of this
        // do not change this until we have API versioning
        return [
          `*[${filter}] [0...50000]`,
          `{${firstProjection}}`,
          `order(${toOrderClause(sort)})`,
          `{${finalProjection}}`
        ].join(' | ')
      }

      return `*[${filter}] | order(${toOrderClause(sort)}) [0...50000] {${finalProjection}}`
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

      const {filter, params} = options
      const layout = this.state.layout || defaultLayout || 'default'
      const typeName = getTypeNameFromSingleTypeFilter(filter, params)
      const filterIsSimpleTypeContraint = isSimpleTypeFilter(filter)
      const hasItems = items => items && items.length > 0
      const query = this.buildListQuery()

      return (
        <DefaultPane
          title={title}
          className={className}
          styles={this.props.styles}
          index={this.props.index}
          scrollTop={this.state.scrollTop}
          menuItems={menuItems}
          menuItemGroups={menuItemGroups}
          isSelected={isSelected}
          isCollapsed={isCollapsed}
          onCollapse={onCollapse}
          onAction={this.handleAction}
          onExpand={onExpand}
          isScrollable={false}
        >
          <QueryContainer query={query} params={params}>
            {({result, loading, error, onRetry}) => {
              if (error) {
                return (
                  <Snackbar kind="danger" action={{title: 'Retry'}} onAction={onRetry}>
                    <div>An error occurred while loading items:</div>
                    <div>{error.message}</div>
                  </Snackbar>
                )
              }

              if (loading) {
                return (
                  <div className={styles[`layout__${layout}`]}>
                    {loading && <Spinner center message="Loading items…" />}
                  </div>
                )
              }

              if (!result) {
                return null
              }

              const items = removePublishedWithDrafts(result ? result.documents : [])

              if (!hasItems(items)) {
                const schemaType = schema.get(typeName)
                return (
                  <div className={styles.empty}>
                    <div>
                      <h3>
                        {filterIsSimpleTypeContraint
                          ? 'No documents of this type found'
                          : 'No documents matching this filter found'}
                      </h3>

                      {typeName &&
                        isActionEnabled(schemaType, 'create') && (
                          <Button color="primary" icon={PlusIcon} onClick={this.handleCreateNew}>
                            New {schemaType.title}
                          </Button>
                        )}
                    </div>
                  </div>
                )
              }

              return (
                <div className={styles[`layout__${layout}`]}>
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
