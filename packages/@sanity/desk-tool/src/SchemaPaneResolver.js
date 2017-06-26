import PropTypes from 'prop-types'
import React from 'react'
import DocumentsPane from './pane/DocumentsPane'
import EditorWrapper from './pane/EditorWrapper'
import TypePaneItem from './pane/TypePaneItem.js'
import QueryContainer from 'part:@sanity/base/query-container'

import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import styles from './styles/SchemaPaneResolver.css'
import Preview from 'part:@sanity/base/preview'
import StateLinkListItem from 'part:@sanity/components/lists/items/statelink'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {withRouterHOC} from 'part:@sanity/base/router'
import {DRAFTS_FOLDER, getDraftId, getPublishedId, isDraftId} from './utils/draftUtils'
import {partition} from 'lodash'
import {isPublishedId} from '../lib/utils/draftUtils'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import {IntentLink} from 'part:@sanity/base/router'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import Pane from 'part:@sanity/components/panes/default'
import typePaneStyles from './pane/styles/TypePane.css'
import DocumentsPaneMenu from './pane/DocumentsPaneMenu'
// Removes published documents that also has a draft
// Todo: this is an ugly hack we should get rid of as it requires the whole set of documents to be in memory to work
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


const TYPE_ITEMS = dataAspects.getInferredTypes().map(typeName => ({
  key: typeName,
  name: typeName,
  title: dataAspects.getDisplayName(typeName)
}))

function readListLayoutSettings() {
  return JSON.parse(window.localStorage.getItem('desk-tool.listlayout-settings') || '{}')
}
function writeListLayoutSettings(settings) {
  window.localStorage.setItem('desk-tool.listlayout-settings', JSON.stringify(settings))
}

function getDocumentKey(document) {
  return getPublishedId(document._id)
}

export default withRouterHOC(class SchemaPaneResolver extends React.PureComponent {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object
    })
  }

  state = {
    listLayoutSettings: readListLayoutSettings(),
    sorting: '_updatedAt desc',
    documentPaneMenuIsOpen: false
  }

  renderTypePaneItem = item => {
    const {selectedType} = this.props.router.state
    const selected = item.name === selectedType
    return (
      <TypePaneItem
        key={item.key}
        selected={selected}
        type={item}
        onClick={this.handleItemClick}
      />
    )
  }

  renderDocumentPaneItem = (item, index, options = {}) => {
    const {selectedType, selectedDocumentId} = this.props.router.state
    const listLayout = this.getListLayoutForType(selectedType)
    const type = schema.get(selectedType)
    const linkState = {
      selectedDocumentId: getPublishedId(item._id),
      selectedType: type.name,
      action: 'edit'
    }

    const isSelected = selectedDocumentId && getPublishedId(item._id) === getPublishedId(selectedDocumentId)

    return (
      <StateLinkListItem
        state={linkState}
        highlighted={options.isHighlighted}
        hasFocus={options.hasFocus}
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
      </StateLinkListItem>
    )
  }

  getDocumentsPane(schemaType) {
    const selectedDocumentId = this.props.router.state.selectedDocumentId
    const params = {type: schemaType.name, draftsPath: `${DRAFTS_FOLDER}.**`}
    const query = `*[_type == $type] | order(${this.state.sorting}) [0...10000] {_id, _type}`
    return (
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

          const documents = removePublishedWithDrafts(result ? result.documents : [])
          return (
            <DocumentsPane
              type={type}
              loading={loading}
              items={documents}
              getItemKey={getDocumentKey}
              renderItem={this.renderDocumentPaneItem}
              onSetListLayout={this.handleSetListLayout}
              onSetSorting={this.handleSetSort}
              listLayout={listLayout}
            />
          )
        }}
      </QueryContainer>
    )
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

  handleSetSort = sorting => {
    this.setState({
      sorting: sorting
    })
  }

  setContainerElement = element => {
    this.containerElement = element
  }

  handleToggleDocumentsPaneMenu = () => {
    this.setState({
      documentPaneMenuIsOpen: !this.state.documentPaneMenuIsOpen
    })
  }

  handleCloseDocumentsPaneMenu = () => {
    this.setState({
      documentPaneMenuIsOpen: false
    })
  }

  renderDocumentsPaneMenu = () => {
    return (
      <DocumentsPaneMenu
        onSetListLayout={this.handleSetListLayout}
        onSetSorting={this.handleSetSorting}
        onGoToCreateNew={this.handleGoToCreateNew}
        onMenuClose={this.handleCloseDocumentsPaneMenu}
        onClickOutside={this.handleCloseDocumentsPaneMenu}
        isOpen={this.state.documentPaneMenuIsOpen}
      />
    )
  }

  render() {
    const {router} = this.props
    const {selectedType, selectedDocumentId, action} = router.state
    const schemaType = schema.get(router.state.selectedType)

    const documentsPaneContent = schemaType ? this.getDocumentsPane(schemaType) : schemaType

    return (
      <div className={styles.container} ref={this.setContainerElement}>
        <SplitController>
          <SplitPaneWrapper defaultWidth={200}>
            <Pane title="Content">
              <ul className={typePaneStyles.list}>
                {
                  TYPE_ITEMS.map((item, i) => {
                    return (
                      <li key={i} className={typePaneStyles.item}>
                        {this.renderTypePaneItem(item)}
                      </li>
                    )
                  })
                }
              </ul>
            </Pane>
          </SplitPaneWrapper>


          <SplitPaneWrapper defaultWidth={200}>
            <Pane
              title={router.state.selectedType}
              renderMenu={this.renderDocumentsPaneMenu}
              defaultWidth={200}
              onMenuToggle={this.handleToggleDocumentsPaneMenu}
            >
              {documentsPaneContent}
            </Pane>
          </SplitPaneWrapper>


          {
            schemaType && selectedDocumentId && action === 'edit' && (
              <SplitPaneWrapper>
                <EditorWrapper
                  documentId={selectedDocumentId}
                  typeName={schemaType.name}
                  schemaType={schemaType}
                />
              </SplitPaneWrapper>
            )
          }
          {/* {
            schemaType && !selectedDocumentId && (
              <div className={styles.editorCreateNew}>
                <IntentLink
                  intent="create"
                  params={{type: selectedType}}
                  className={styles.editorCreateNewLink}
                >
                  Create new &quot;{schemaType.title}&quot;
                </IntentLink>
              </div>
            )
          }

          {
            selectedType && !schemaType && (
            <h2 className={styles.emptyText}>
              Could not find any type
              named <strong><em>{selectedType}</em></strong> in
              schema <strong><em>{schema.name}</em></strong>…
            </h2>
            )
          }
          {
            action && action !== 'edit' && (
            // this would normally never happen
            <h2 className={styles.emptyText}>
              Invalid action: {action}
            </h2>
            )
          }

          {
            !selectedType && (
            <h2 className={styles.emptyText}>Select a type to begin…</h2>
            )
          } */}

        </SplitController>
      </div>
    )
  }
})
