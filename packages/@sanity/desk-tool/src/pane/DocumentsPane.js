import PropTypes from 'prop-types'
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import SortIcon from 'part:@sanity/base/sort-icon'
import Ink from 'react-ink'
import {partition, uniqBy, get} from 'lodash'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import QueryContainer from 'part:@sanity/base/query-container'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import Pane from 'part:@sanity/components/panes/default'
import Button from 'part:@sanity/components/buttons/default'
import PlusIcon from 'part:@sanity/base/plus-icon'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {Tooltip} from '@sanity/react-tippy'
import {
  DRAFTS_FOLDER,
  getPublishedId,
  isDraftId,
  isPublishedId,
  getDraftId
} from '../utils/draftUtils'
import DocumentsPaneMenu from './DocumentsPaneMenu'
import ListView from './ListView'
import styles from './styles/DocumentsPane.css'

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
  return orderBy
    .map(ordering => [ordering.field, ordering.direction].filter(Boolean).join(' '))
    .join(', ')
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
      return {
        ...doc,
        hasPublished: publishedIds.includes(publishedId),
        hasDraft: draftIds.includes(draftId)
      }
    })
    .filter(doc => !(isPublishedId(doc._id) && doc.hasDraft))
}

function writeSettingsForType(type, settings) {
  writeSettings(
    Object.assign(readSettings(), {
      [type]: settings
    })
  )
}

export default withRouterHOC(
  class DocumentsPane extends React.PureComponent {
    static propTypes = {
      loading: PropTypes.bool,
      selectedType: PropTypes.string,
      selectedDocumentId: PropTypes.string,
      schemaType: PropTypes.object,
      isCollapsed: PropTypes.bool,
      published: PropTypes.array,
      drafts: PropTypes.array,
      onSetListLayout: PropTypes.any,
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
      this.setState(
        prevState => ({
          settings: {
            ...prevState.settings,
            listLayout: listLayout.key
          }
        }),
        this.writeSettings
      )
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
      this.setState(
        prevState => ({
          settings: {
            ...prevState.settings,
            ordering: ordering.name
          }
        }),
        this.writeSettings
      )
    }

    writeSettings() {
      writeSettingsForType(this.props.selectedType, this.state.settings)
    }

    handleToggleMenu = evt => {
      if (evt) {
        evt.stopPropagation()
      }

      this.setState(prevState => ({menuIsOpen: !prevState.menuIsOpen}))
    }

    handleCloseMenu = evt => {
      if (evt) {
        evt.stopPropagation()
      }

      this.setState(prevState => ({menuIsOpen: !prevState.menuIsOpen}))
    }

    isLiveEditEnabled() {
      const selectedSchemaType = schema.get(this.props.selectedType)
      return selectedSchemaType.liveEdit === true
    }

    getOrderingOptions(selectedType) {
      const type = schema.get(selectedType)

      const optionsWithDefaults = type.orderings
        ? type.orderings.concat(DEFAULT_ORDERING_OPTIONS)
        : DEFAULT_ORDERING_OPTIONS

      return uniqBy(optionsWithDefaults, 'name').map(option => {
        return {
          ...option,
          icon: option.icon || SortIcon,
          title: (
            <span>
              Sort by <b>{option.title}</b>
            </span>
          )
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

    renderStatus = item => {
      const isLiveEditEnabled = this.isLiveEditEnabled()

      return (
        <div className={styles.itemStatus}>
          {!item.hasPublished && (
            <Tooltip title="Not published" arrow theme="light" distance="2" sticky size="small">
              <i>
                <VisibilityOffIcon />
              </i>
            </Tooltip>
          )}
          {!isLiveEditEnabled &&
            item.hasDraft &&
            item.hasPublished && (
              <Tooltip
                title="Has changes not yet published"
                arrow
                theme="light"
                distance="2"
                sticky
                size="small"
              >
                <i>
                  <EditIcon />
                </i>
              </Tooltip>
            )}
        </div>
      )
    }

    renderDocumentPaneItem = (item, index, options = {}) => {
      const {selectedType, selectedDocumentId} = this.props
      const {settings} = this.state

      const ordering = this.getOrderingOptions(selectedType).find(
        option => option.name === settings.ordering
      )

      const type = schema.get(selectedType)
      const linkState = {
        selectedDocumentId: getPublishedId(item._id),
        selectedType: type.name,
        action: 'edit'
      }

      const isSelected =
        selectedDocumentId && getPublishedId(item._id) === getPublishedId(selectedDocumentId)

      return (
        <StateLink state={linkState} className={styles.link} tabIndex={0}>
          <div className={isSelected ? styles.selectedItem : styles.item}>
            <Preview
              value={item}
              ordering={ordering}
              layout={settings.listLayout}
              type={type}
              status={() => this.renderStatus(item)}
            />
          </div>
          <Ink duration={1000} opacity={0.1} radius={200} />
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
      const {selectedDocumentId, schemaType, isCollapsed, router} = this.props

      const {settings} = this.state
      const currentOrderingOption =
        this.getOrderingOptions(schemaType.name).find(
          option => option.name === settings.ordering
        ) || DEFAULT_SELECTED_ORDERING_OPTION
      const params = {type: schemaType.name, draftsPath: `${DRAFTS_FOLDER}.**`}
      const query = `*[_type == $type] | order(${toGradientOrderClause(
        currentOrderingOption.by
      )}) [0...10000] {_id, _type}`
      const {selectedType, action} = router.state
      const isSelected = selectedType && !action && !selectedDocumentId
      return (
        <Pane
          {...this.props}
          renderMenu={this.renderDocumentsPaneMenu}
          renderFunctions={this.renderFunctions}
          defaultWidth={200}
          isCollapsed={isCollapsed}
          onMenuToggle={this.handleToggleMenu}
          scrollTop={this.state.scrollTop}
          isSelected={isSelected}
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
                      {get(this.props, 'router.state.action') !== 'edit' && (
                        <Button color="primary" icon={PlusIcon} onClick={this.handleGoToCreateNew}>
                          New {type.title}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div className={styles[`layout__${settings.listLayout}`]}>
                  {loading && <Spinner center message="Loading items…" />}
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
  }
)
