import PropTypes from 'prop-types'
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from './styles/DocumentsPane.css'
import {StateLink, IntentLink, withRouterHOC} from 'part:@sanity/base/router'
import SortIcon from 'part:@sanity/base/sort-icon'
import Ink from 'react-ink'

import ListView from './ListView'
import {partition, uniqBy} from 'lodash'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import QueryContainer from 'part:@sanity/base/query-container'
import {DRAFTS_FOLDER, getPublishedId, isDraftId, getDraftId} from '../utils/draftUtils'
import {isPublishedId} from '../utils/draftUtils'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import Pane from 'part:@sanity/components/panes/default'
import DocumentsPaneMenu from './DocumentsPaneMenu'
import Button from 'part:@sanity/components/buttons/default'
import PlusIcon from 'part:@sanity/base/plus-icon'
import Snackbar from 'part:@sanity/components/snackbar/default'

const NOOP = () => {} // eslint-disable-line

const LOCALSTORAGE_KEY = 'desk-tool.documents-pane-settings'

function readSettings() {
  return JSON.parse(window.localStorage.getItem(LOCALSTORAGE_KEY) || '{}')
}

function writeSettings(settings) {
  window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(settings))
}

function getDocumentKey(document) {
  return getPublishedId(document._id)
}

function toGradientOrderClause(orderBy) {
  return orderBy.map(
    ordering => [ordering.field, ordering.direction]
      .filter(Boolean)
      .join(' ')
  ).join(', ')
}

const ORDER_BY_UPDATED_AT = {
  title: 'Last edited',
  name: 'updatedAt',
  by: [{field: '_updatedAt', direction: 'desc'}]
}

const ORDER_BY_CREATED_AT = {
  title: 'Created',
  name: 'createdAt',
  by: [{field: '_createdAt', direction: 'desc'}]
}

const DEFAULT_SELECTED_ORDERING_OPTION = ORDER_BY_UPDATED_AT
const DEFAULT_ORDERING_OPTIONS = [ORDER_BY_UPDATED_AT, ORDER_BY_CREATED_AT]

function removePublishedWithDrafts(documents) {

  const [draftIds, publishedIds] = partition(documents.map(doc => doc._id), isDraftId)

  return documents
    .map(doc => {
      const publishedId = getPublishedId(doc._id)
      const draftId = getDraftId(doc._id)
      return ({
        ...doc,
        hasPublished: publishedIds.includes(publishedId),
        hasDraft: draftIds.includes(draftId)
      })
    })
    .filter(doc => !(isPublishedId(doc._id) && doc.hasDraft))
}

function writeSettingsForType(type, settings) {
  writeSettings(Object.assign(readSettings(), {
    [type]: settings
  }))
}

export default withRouterHOC(class DocumentsPane extends React.PureComponent {
  static propTypes = {
    selectedType: PropTypes.string,
    selectedDocumentId: PropTypes.string,
    schemaType: PropTypes.object,
    isCollapsed: PropTypes.bool,
    router: PropTypes.object
  }

  static defaultProps = {
    loading: false,
    isCollapsed: false,
    published: [],
    drafts: [],
    onSetListLayout: NOOP
  }

  handleSetListLayout = listLayout => {
    this.setState(prevState => ({
      settings: {
        ...prevState.settings,
        listLayout: listLayout.key
      }
    }), this.writeSettings)
  }

  constructor(props) {
    super()
    const settings = readSettings()
    this.state = {
      settings: (settings && settings[props.selectedType]) || {
        listLayout: 'default',
        ordering: DEFAULT_SELECTED_ORDERING_OPTION
      },
      menuIsOpen: false
    }
  }

  handleSetOrdering = ordering => {
    this.setState(prevState => ({
      settings: {
        ...prevState.settings,
        ordering: ordering.name
      }
    }), this.writeSettings)
  }

  writeSettings() {
    writeSettingsForType(this.props.selectedType, this.state.settings)
  }

  handleToggleMenu = () => {
    this.setState({
      menuIsOpen: !this.state.menuIsOpen
    })
  }

  handleCloseMenu = () => {
    this.setState({
      menuIsOpen: !this.state.menuIsOpen
    })
  }

  getOrderingOptions(selectedType) {
    const type = schema.get(selectedType)

    const optionsWithDefaults = type.orderings
      ? type.orderings.concat(DEFAULT_ORDERING_OPTIONS)
      : DEFAULT_ORDERING_OPTIONS

    return uniqBy(optionsWithDefaults, 'name')
      .map(option => {
        return {
          ...option,
          icon: option.icon || SortIcon,
          title: <span>Sort by <b>{option.title}</b></span>
        }
      })
  }

  handleGoToCreateNew = () => {
    const {selectedType, router} = this.props
    router.navigateIntent('create', {type: selectedType})
  }

  renderDocumentsPaneMenu = () => {
    const {selectedType} = this.props
    const type = schema.get(selectedType)
    return (
      <DocumentsPaneMenu
        onSetListLayout={this.handleSetListLayout}
        onSetOrdering={this.handleSetOrdering}
        onGoToCreateNew={this.handleGoToCreateNew}
        onMenuClose={this.handleCloseMenu}
        onClickOutside={this.handleCloseMenu}
        isOpen={this.state.menuIsOpen}
        orderingOptions={this.getOrderingOptions(selectedType)}
        type={type}
      />
    )
  }

  renderDocumentPaneItem = (item, index, options = {}) => {
    const {selectedType, selectedDocumentId} = this.props
    const {settings} = this.state

    const ordering = this.getOrderingOptions(selectedType)
      .find(option => option.name === settings.ordering)

    const type = schema.get(selectedType)
    const linkState = {
      selectedDocumentId: getPublishedId(item._id),
      selectedType: type.name,
      action: 'edit'
    }

    const isSelected = selectedDocumentId && getPublishedId(item._id) === getPublishedId(selectedDocumentId)

    return (
      <StateLink
        state={linkState}
        className={styles.link}
        tabIndex={0}
      >

        <div className={isSelected ? styles.selectedItem : styles.item}>
          <Preview
            value={item}
            ordering={ordering}
            layout={settings.listLayout}
            type={type}
          />
          <div className={styles.itemStatus}>
            {
              !item.hasPublished && (
                <i title="Not published"><VisibilityOffIcon /></i>
              )
            }
            {
              item.hasDraft && item.hasPublished && (
                <i title="Has changes not yet published"><EditIcon /></i>
              )
            }
          </div>
        </div>
        <Ink duration={200} opacity={0.20} radius={200} />
      </StateLink>
    )
  }

  renderFunctions = isCollapsed => {
    const {selectedType} = this.props
    const type = schema.get(selectedType)
    return (
      <Button
        title={`Create new ${type.name}`}
        icon={PlusIcon}
        color="primary"
        kind="simple"
        onClick={this.handleGoToCreateNew}
      />
    )
  }

  handleScroll = scrollTop => {
    this.setState({scrollTop})
  }

  render() {
    const {
      selectedDocumentId,
      schemaType,
      isCollapsed
    } = this.props

    const {settings} = this.state
    const currentOrderingOption = this.getOrderingOptions(schemaType.name)
      .find(option => option.name === settings.ordering) || DEFAULT_SELECTED_ORDERING_OPTION

    const params = {type: schemaType.name, draftsPath: `${DRAFTS_FOLDER}.**`}
    const query = `*[_type == $type] | order(${toGradientOrderClause(currentOrderingOption.by)}) [0...10000] {_id, _type}`
    return (
      <Pane
        {...this.props}
        renderMenu={this.renderDocumentsPaneMenu}
        renderFunctions={this.renderFunctions}
        defaultWidth={200}
        isCollapsed={isCollapsed}
        onMenuToggle={this.handleToggleMenu}
        scrollTop={this.state.scrollTop}
      >
        <QueryContainer
          query={query}
          params={params}
          type={schemaType}
          selectedId={selectedDocumentId}
          settings={settings}
        >
          {({result, loading, error, onRetry, type}) => {
            if (error) {
              return (
                <Snackbar
                  kind="danger"
                  action={{title: 'Retry'}}
                  onAction={onRetry}
                >
                  <div>An error occurred while loading items:</div>
                  <div>{error.message}</div>
                </Snackbar>
              )
            }

            const items = removePublishedWithDrafts(result ? result.documents : [])

            return (
              <div className={styles.root}>
                {loading && (
                  <div className={styles.spinner}>
                    <Spinner center message="Loading items…" />
                  </div>
                )
                }

                {!loading && !items && (
                  <div className={styles.empty}>
                    <h3>Nothing here. Yet…</h3>
                    <IntentLink
                      className={styles.emptyCreateNew}
                      title={`Create new ${type.title}`}
                      intent="create"
                      params={{type: type.name}}
                    >
                      Create new {type.title}
                    </IntentLink>
                  </div>
                )}

                {items && (
                  <ListView
                    onScroll={this.handleScroll}
                    items={items}
                    getItemKey={getDocumentKey}
                    renderItem={this.renderDocumentPaneItem}
                    listLayout={settings.listLayout}
                  />
                )}

              </div>
            )
          }}
        </QueryContainer>
      </Pane>
    )
  }
})
