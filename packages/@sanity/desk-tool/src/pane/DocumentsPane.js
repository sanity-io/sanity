import PropTypes from 'prop-types'
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from './styles/DocumentsPane.css'
import {StateLink, IntentLink, withRouterHOC} from 'part:@sanity/base/router'
import {Item} from 'part:@sanity/components/lists/default'
import ListView from './ListView'
import {partition} from 'lodash'
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

function readListLayoutSettings() {
  return JSON.parse(window.localStorage.getItem('desk-tool.listlayout-settings') || '{}')
}

function writeListLayoutSettings(settings) {
  window.localStorage.setItem('desk-tool.listlayout-settings', JSON.stringify(settings))
}

function getDocumentKey(document) {
  return getPublishedId(document._id)
}

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

export default withRouterHOC(class DocumentsPane extends React.PureComponent {
  static propTypes = {
    selectedType: PropTypes.string,
    selectedDocumentId: PropTypes.string,
    schemaType: PropTypes.object,
    isCollapsed: PropTypes.bool,
    router: PropTypes.shape({
      state: PropTypes.shape({
        selectType: PropTypes.string,
        selectedType: PropTypes.string
      })
    })
  }

  static defaultProps = {
    loading: false,
    isCollapsed: false,
    published: [],
    drafts: [],
    onSetSorting: NOOP,
    onSetListLayout: NOOP
  }

  state = {
    listLayoutSettings: readListLayoutSettings(),
    sorting: '_updatedAt desc',
    menuIsOpen: false
  }

  static contextTypes = {
    __internalRouter: PropTypes.object
  }


  handleSetListLayout = listLayout => {
    const {selectedType} = this.props.router.state
    const nextSettings = Object.assign(readListLayoutSettings(), {
      [selectedType]: listLayout
    })
    writeListLayoutSettings(nextSettings)
    this.setState({listLayoutSettings: nextSettings})
  }

  getListLayoutForType(typeName) {
    return this.state.listLayoutSettings[typeName] || 'default'
  }

  handleSetSorting = sorting => {
    this.setState({
      sorting: sorting
    })
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

  handleGoToCreateNew = () => {
    const {selectedType} = this.props
    const type = schema.get(selectedType)
    const url = this.context.__internalRouter.resolveIntentLink('create', {
      type: type.name
    })
    this.context.__internalRouter.navigateUrl(url)
  }

  renderDocumentsPaneMenu = () => {
    return (
      <DocumentsPaneMenu
        onSetListLayout={this.handleSetListLayout}
        onSetSorting={this.handleSetSorting}
        onGoToCreateNew={this.handleGoToCreateNew}
        onMenuClose={this.handleCloseMenu}
        onClickOutside={this.handleCloseMenu}
        isOpen={this.state.menuIsOpen}
      />
    )
  }

  renderDocumentPaneItem = (item, index, options = {}) => {
    const {selectedType, selectedDocumentId} = this.props
    const listLayout = this.getListLayoutForType(selectedType)
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
            layout={listLayout}
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

  render() {
    const {
      router,
      selectedDocumentId,
      schemaType,
      isCollapsed
    } = this.props


    const params = {type: schemaType.name, draftsPath: `${DRAFTS_FOLDER}.**`}
    const query = `*[_type == $type] | order(${this.state.sorting}) [0...10000] {_id, _type}`

    return (
      <Pane
        {...this.props}
        renderMenu={this.renderDocumentsPaneMenu}
        renderFunctions={this.renderFunctions}
        defaultWidth={200}
        isCollapsed={isCollapsed}
        onMenuToggle={this.handleToggleMenu}
      >
        <QueryContainer
          query={query}
          params={params}
          type={schemaType}
          selectedId={selectedDocumentId}
          listLayout={this.getListLayoutForType(schemaType.name)}
        >
          {({result, loading, error, onRetry, type, listLayout}) => {
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
                    items={items}
                    getItemKey={getDocumentKey}
                    renderItem={this.renderDocumentPaneItem}
                    listLayout={listLayout}
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
