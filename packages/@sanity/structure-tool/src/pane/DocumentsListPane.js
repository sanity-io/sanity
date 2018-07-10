import React from 'react'
import PropTypes from 'prop-types'
import {partition} from 'lodash'
import {withRouterHOC} from 'part:@sanity/base/router'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import IntentButton from 'part:@sanity/components/buttons/intent'
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

function noActionFn(title) {
  // eslint-disable-next-line no-console
  console.warn('No action defined for function')
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

// eslint-disable-next-line react/prefer-stateless-function
export default withRouterHOC(
  class DocumentsListPane extends React.PureComponent {
    static propTypes = {
      index: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      className: PropTypes.string,
      layout: PropTypes.string,
      styles: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      router: PropTypes.shape({
        state: PropTypes.shape({
          panes: PropTypes.arrayOf(PropTypes.string)
        })
      }).isRequired,
      options: PropTypes.shape({
        filter: PropTypes.string.isRequired,
        params: PropTypes.object // eslint-disable-line react/forbid-prop-types
      }).isRequired,
      functions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string.isRequired,
          icon: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
          action: PropTypes.func,
          intent: PropTypes.shape({type: PropTypes.string, params: PropTypes.object})
        })
      ),
      isCollapsed: PropTypes.bool.isRequired,
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func
    }

    static defaultProps = {
      className: '',
      styles: {},
      functions: [],
      layout: 'default',
      onExpand: undefined,
      onCollapse: undefined
    }

    actionHandlers = {}

    itemIsSelected(item) {
      const {router, index} = this.props
      const selected = (router.state.panes || [])[index]
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
        layout={this.props.layout}
        value={item}
        status={getStatusIndicator(item)}
        schemaType={schema.get(item._type)}
        isSelected={this.itemIsSelected(item._id)}
      />
    )

    renderIntentFunction = func => {
      return (
        <IntentButton
          key={func.id || func.title}
          title={func.title}
          icon={func.icon}
          color="primary"
          kind="simple"
          intent={func.intent.type}
          params={func.intent.params}
        />
      )
    }

    renderFunction = func => {
      const action = func.action || this.actionHandlers[func.id] || noActionFn
      return (
        <Button
          key={func.id || func.title}
          title={func.title}
          icon={func.icon}
          color="primary"
          kind="simple"
          onClick={action}
        />
      )
    }

    renderFunctions = isCollapsed => {
      return this.props.functions.map(
        func => (func.intent ? this.renderIntentFunction(func) : this.renderFunction(func))
      )
    }

    render() {
      const {title, options, layout, className, isCollapsed, onCollapse, onExpand} = this.props
      const {filter, params} = options
      return (
        <DefaultPane
          title={title}
          styles={this.props.styles}
          className={className}
          renderFunctions={this.renderFunctions}
          isCollapsed={isCollapsed}
          onCollapse={onCollapse}
          onExpand={onExpand}
        >
          <QueryContainer
            // @todo filter the filter! Only allow the actual filter, not a full query
            query={`*[${filter}] | order(_createdAt desc) [0...10000] {_id, _type}`}
            params={params}
          >
            {({result, loading, error, onRetry, type}) => {
              if (error) {
                return (
                  <Snackbar kind="danger" action={{title: 'Retry'}} onAction={onRetry}>
                    <div>An error occurred while loading items:</div>
                    <div>{error.message}</div>
                  </Snackbar>
                )
              }

              const items = removePublishedWithDrafts(result ? result.documents : [])

              if (!loading && (!items || items.length === 0)) {
                return (
                  <div className={styles.empty}>
                    <div>
                      <h3>
                        There are no documents of type <strong>{type.title}</strong> yet.
                      </h3>
                      {/* @todo figure out a way to make the below work again */}
                      {/*get(this.props, 'router.state.action') !== 'edit' && (
                        <Button color="primary" icon={PlusIcon} onClick={this.handleGoToCreateNew}>
                          New {type.title}
                        </Button>
                      )*/}
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
