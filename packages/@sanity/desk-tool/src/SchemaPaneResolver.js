import PropTypes from 'prop-types'
import React from 'react'
import DocumentsPane from './pane/DocumentsPane'
import TypePane from './pane/TypePane'
import EditorPane from './pane/EditorPane'
import TypePaneItem from './pane/TypePaneItem.js'
import QueryContainer from 'part:@sanity/base/query-container'

import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import documentStore from 'part:@sanity/base/datastore/document'
import styles from './styles/SchemaPaneResolver.css'
import Preview from 'part:@sanity/base/preview'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import StateLinkListItem from 'part:@sanity/components/lists/items/statelink'
import {withRouterHOC} from 'part:@sanity/base/router'
import elementResizeDetectorMaker from 'element-resize-detector'
import {DRAFTS_FOLDER, getDraftId, getPublishedId, isDraftId, newDraftFrom} from './utils/draftUtils'
import {partition} from 'lodash'
import {isPublishedId} from '../lib/utils/draftUtils'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import EditIcon from 'part:@sanity/base/edit-icon'

// Debounce function on requestAnimationFrame
function debounceRAF(fn) {
  let scheduled
  return function debounced(...args) {
    if (!scheduled) {
      requestAnimationFrame(() => {
        fn.call(this, ...scheduled)
        scheduled = null
      })
    }
    scheduled = args
  }
}

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

function isCreate(routerState) {
  return routerState.action === 'create' && !routerState.selectedDocumentId
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
    navTranslateX: 0,
    editorWidth: '100%',
    editorTranslateX: 0,
    navIsMinimized: false,
    navIsHovered: false,
    navIsClicked: false
  }

  hasBeenResized = false
  oldNavTranslateX = 0
  lastNavOffsetWidth = 0

  componentDidMount() {
    this.handleResize()
    window.addEventListener('resize', this.handleResize, false)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize, false)
    this.erd.removeAllListeners(this.navigationElement)
    this.erd.uninstall(this.navigationElement)
  }

  componentWillMount() {
    this.erd = elementResizeDetectorMaker({strategy: 'scroll'})
    const {router} = this.props
    if (isCreate(router.state)) {
      this.doCreate(router)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!isCreate(this.props.router.state) && isCreate(nextProps.router.state)) {
      this.doCreate(nextProps.router)
    }
  }

  componentDidUpdate() {
    // Hack
    // Panes needs to be resized after the content is loaded
    // Look at this later
    this.handleResize()
  }

  doCreate(router) {
    const {selectedType} = router.state
    documentStore.create(newDraftFrom({_type: selectedType}))
      .subscribe(document => {
        router.navigate({
          selectedDocumentId: getPublishedId(document._id),
          selectedType: selectedType,
          action: 'edit'
        }, {replace: true})
      })
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
      selectedDocumentId: item._id,
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
    const query = `*[_type == $type] | order(${this.state.sorting}) [0...3000] {_id, _type}`
    return (
      <QueryContainer
        query={query}
        params={params}
        type={schemaType}
        selectedId={selectedDocumentId}
        listLayout={this.getListLayoutForType(schemaType.name)}
      >
        {({result, loading, error, type, listLayout}) => {
          if (error) {
            return (
              <FullscreenDialog kind="danger" title="An error occurred while loading items" isOpen>
                {error.message}
              </FullscreenDialog>
            )
          }

          // Hack
          // Panes needs to be resized after the content is loaded
          // Look at this later
          if (!this.hasBeenResized) {
            this.handleResize()
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

  setNavigationElement = element => {
    this.navigationElement = element
    if (this.navigationElement) {
      this.erd.listenTo(this.navigationElement, el => {
        if (el.offsetWidth != this.lastNavOffsetWidth) {
          this.lastNavOffsetWidth = el.offsetWidth
          this.handleResize()
        }
      })
    }
  }

  setEditorPaneElement = element => {
    this.editorPaneElement = element
  }

  canReposition = () => {
    const {selectedType, selectedDocumentId} = this.props.router.state
    return !!(this.navigationElement && this.editorPaneElement && this.containerElement && selectedType && selectedDocumentId)
  }

  resetPosition = () => {
    this.setState({
      navTranslateX: 0,
      editorWidth: '100%',
      navIsMinimized: false,
      editorTranslateX: 0
    })
  }

  handleResize = debounceRAF(() => {
    // Todo optimize later so that we dont resize when we dont need to
    // if (this.initialWindowWidth === window.innerWidth) {
    //   return
    // }

    const {selectedType, selectedDocumentId} = this.props.router.state
    if (!selectedDocumentId || !selectedType) {
      this.resetPosition()
      return
    }

    // Uses the css the determine if it should reposition with an Media Query
    // check if the window has resized
    const computedStyle = window.getComputedStyle(this.containerElement, '::before')
    const contentValue = computedStyle.getPropertyValue('content')
    this.shouldReposition = contentValue === '"shouldReposition"' || contentValue === 'shouldReposition' // Is quoted

    if (!this.shouldReposition || this.state.navIsHovered) {
      return
    }

    // Setup
    this.navWidth = this.navigationElement.offsetWidth
    const editorPaneWidth = this.editorPaneElement.offsetWidth
    const containerWidth = this.containerElement.offsetWidth
    let navTranslateX = 0
    let editorWidth = `${containerWidth - this.navWidth}px`

    // Setting dimensions based on font-size.
    this.padding = parseInt(window.getComputedStyle(document.body).fontSize, 10) * 3
    const editorPaneMinWidth = parseInt(window.getComputedStyle(this.editorPaneElement, null).minWidth, 10)

    const diff = containerWidth - editorPaneWidth - this.navWidth

    // Check if we need to push the navbar outside view
    if (diff <= 0) {
      navTranslateX = Math.min(containerWidth - editorPaneMinWidth - this.navWidth, 0)
      editorWidth = `${containerWidth - navTranslateX - this.navWidth}px`
    }

    // Set states that triggers re-render
    this.setState({
      navTranslateX: navTranslateX,
      navIsMinimized: navTranslateX < 0,
      editorWidth: editorWidth
    })
  })

  handlePanesMouseEnter = event => {
    const {navTranslateX} = this.state
    this.oldNavTranslateX = navTranslateX

    if (!this.state.navIsMinimized || !this.shouldReposition) {
      return
    }

    if (!this.canReposition() || !this.shouldReposition || navTranslateX == 0) {
      this.resetPosition()
      return
    }

    const x = 20

    this.setState({
      navTranslateX: navTranslateX + x,
      editorTranslateX: x,
      navIsHovered: true
    })

  }

  handlePanesMouseLeave = event => {
    if (this.shouldReposition) {
      this.setState({
        navTranslateX: Math.min(this.oldNavTranslateX, 0),
        editorTranslateX: 0,
        navIsHovered: false
      })
    }
  }

  handlePanesClick = event => {
    const {navWidth, oldNavTranslateX} = this
    const navVisibleWidth = navWidth + oldNavTranslateX
    if (this.shouldReposition) {
      this.setState({
        navTranslateX: 0,
        editorTranslateX: navWidth - navVisibleWidth,
        navIsMinimized: false,
        navIsClicked: true
      })
    }
  }

  render() {
    const {router} = this.props
    const {selectedType, selectedDocumentId} = router.state
    const {navTranslateX, editorTranslateX, editorWidth, navIsMinimized, navIsClicked} = this.state

    const typesPane = (
      <TypePane
        items={TYPE_ITEMS}
        renderItem={this.renderTypePaneItem}
      />
    )

    const schemaType = schema.get(router.state.selectedType)

    const documentsPane = schemaType ? this.getDocumentsPane(schemaType) : schemaType

    return (
      <div className={styles.container} ref={this.setContainerElement}>
        <div
          className={`
            ${navIsMinimized ? styles.navigationPanesContainerIsMinimized : styles.navigationPanesContainer}
            ${navIsClicked ? styles.navigationPanesContainerIsClicked : ''}
          `}
          ref={this.setNavigationElement}
          onClick={this.handlePanesClick}
          onMouseEnter={this.handlePanesMouseEnter}
          onMouseLeave={this.handlePanesMouseLeave}
          style={{
            transform: `translateX(${navTranslateX}px)`
          }}
        >
          {typesPane}
          {documentsPane}
        </div>
        <div
          className={styles.editorContainer}
          ref={this.setEditorPaneElement}
          style={{
            width: editorWidth,
            transform: `translateX(${editorTranslateX}px)`
          }}
        >
          {
            schemaType && selectedDocumentId && (
              <EditorPane
                documentId={selectedDocumentId && selectedDocumentId}
                typeName={schemaType.name}
              />
            )
          }
          {selectedType && !schemaType && (
            <h2 className={styles.emptyText}>
              Could not find any type
              named <strong><em>{selectedType}</em></strong> in
              schema <strong><em>{schema.name}</em></strong>…
            </h2>
          )}
          {!selectedType && (
            <h2 className={styles.emptyText}>Select a type to begin…</h2>
          )}
          <div>&nbsp;</div>
        </div>
      </div>
    )
  }
})
