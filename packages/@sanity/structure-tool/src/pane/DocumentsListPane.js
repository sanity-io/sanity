import React from 'react'
import PropTypes from 'prop-types'
import {partition} from 'lodash'
import {withRouterHOC} from 'part:@sanity/base/router'
import schema from 'part:@sanity/base/schema'
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

import styles from './styles/DocumentsListPane.css'
import listStyles from './styles/ListView.css'
import InfiniteList from './InfiniteList'
import PaneItem from './PaneItem'

function removePublishedWithDrafts(documents) {
  const [draftIds, publishedIds] = partition(documents.map(doc => doc._id), isDraftId)

  return documents
    .map(doc => {
      const publishedId = getPublishedId(doc._id)
      const draftId = getDraftId(doc._id)
      return {
        ...doc,
        hasPublished: publishedIds.includes(publishedId),
        hasDraft: draftIds.includes(draftId)
      }
    })
    .filter(doc => !(isPublishedId(doc._id) && doc.hasDraft))
}

function getDocumentKey(document) {
  return getPublishedId(document._id)
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
      isCollapsed: PropTypes.bool.isRequired,
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func
    }

    static defaultProps = {
      styles: {},
      layout: 'default',
      onExpand: undefined,
      onCollapse: undefined
    }

    itemIsSelected(item) {
      const {router, index} = this.props
      const selected = (router.state.panes || [])[index]
      return selected && item === selected
    }

    getLinkStateForItem = name => {
      const {router, index} = this.props
      const panes = (router.state.panes || []).slice(0, index).concat(name)
      return {panes}
    }

    renderItem = item => (
      <PaneItem
        id={item._id}
        getLinkState={this.getLinkStateForItem}
        layout={this.props.layout}
        value={item}
        schemaType={schema.get(item._type)}
        isSelected={this.itemIsSelected(item._id)}
      />
    )

    render() {
      const {title, options, layout, className, isCollapsed, onCollapse, onExpand} = this.props
      const {filter, params} = options
      return (
        <DefaultPane
          title={title}
          styles={this.props.styles}
          className={className}
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
