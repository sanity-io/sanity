import React, {PropTypes} from 'react'
import Pane from 'part:@sanity/desk-tool/pane'
import TypePane from './pane/TypePane'
import EditorPane from './pane/EditorPane'
import TypePaneItem from './pane/TypePaneItem.js'
import QueryContainer from 'part:@sanity/base/query-container'

import UrlDocId from './utils/UrlDocId'
import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import documentStore from 'part:@sanity/base/datastore/document'
import styles from './styles/SchemaPaneResolver.css'
import Preview, {utils as previewUtils} from 'part:@sanity/base/preview'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import {withRouterHOC} from 'part:@sanity/base/router'

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

const TYPE_ITEMS = dataAspects.getInferredTypes().map(typeName => ({
  key: typeName,
  name: typeName,
  title: dataAspects.getDisplayName(typeName)
}))

function readListViewSettings() {
  return JSON.parse(window.localStorage.getItem('desk-tool.listview-settings') || '{}')
}
function writeListViewSettings(settings) {
  window.localStorage.setItem('desk-tool.listview-settings', JSON.stringify(settings))
}

export default withRouterHOC(class SchemaPaneResolver extends React.PureComponent {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object
    })
  }

  state = {
    listViewSettings: readListViewSettings(),
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

  componentDidMount() {
    this.handleResize()
    window.addEventListener('resize', this.handleResize, false)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize, false)
  }

  componentWillMount() {
    this.checkRedirect()
  }

  componentDidUpdate() {
    this.checkRedirect()
    // Hack
    // Panes needs to be resized after the content is loaded
    // Look at this later
    this.handleResize()
  }

  checkRedirect() {
    const {router} = this.props

    if (router.state.action === 'create' && !router.state.selectedDocumentId) {
      const selectedType = router.state.selectedType
      documentStore.create({_type: `${schema.name}.${selectedType}`}).subscribe(document => {
        router.navigate({
          action: 'edit',
          selectedType: selectedType,
          selectedDocumentId: UrlDocId.encode(document._id)
        }, {replace: true})
      })
    }
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

  renderDocumentPaneItem = item => {
    const {selectedType} = this.props.router.state
    const listView = this.getListViewForType(selectedType)
    const type = schema.get(selectedType)

    return (
      <Preview
        value={item}
        view={listView}
        type={type}
      />
    )
  }

  getDocumentsPane(typeName) {
    const schemaType = schema.get(typeName)
    const previewConfig = schemaType.preview

    const query = `${schema.name}.${schemaType.name}[limit: 50, order: ${this.state.sorting}] {${
      previewUtils.stringifyGradientQuerySelection(previewConfig.fields)
    }}`

    return (
      <QueryContainer query={query} type={schemaType}>
        {({result, loading, error, type}) => {
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

          const items = result && result.documents && result.documents.map(item => {
            item.stateLink = {selectedType: type.name, action: 'edit', selectedDocumentId: UrlDocId.encode(item._id)}
            return item
          })
          return (
            <Pane
              contentType="documents"
              type={type}
              loading={loading}
              items={items}
              renderItem={this.renderDocumentPaneItem}
              onSetListView={this.handleSetListView}
              onSetSorting={this.handleSetSort}
              listView={this.getListViewForType(type.name)}
            />
          )
        }}
      </QueryContainer>
    )
  }


  handleSetListView = listView => {
    const {selectedType} = this.props.router.state
    const nextSettings = Object.assign(readListViewSettings(), {
      [selectedType]: listView
    })
    writeListViewSettings(nextSettings)
    this.setState({listViewSettings: nextSettings})
  }

  getListViewForType(type) {
    return this.state.listViewSettings[type] || 'default'
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

    // Uses the css the determine if it should reposition with an Media Query
    // check if the window has resized
    const computedStyle = window.getComputedStyle(this.containerElement, '::before')
    const contentValue = computedStyle.getPropertyValue('content')
    this.shouldReposition = contentValue === '"shouldReposition"' || contentValue === 'shouldReposition' // Is quoted

    if (!this.shouldReposition || this.state.navIsHovered) {
      return false
    }

    // Setup
    this.navWidth = this.navigationElement.offsetWidth
    const editorPaneWidth = this.editorPaneElement.offsetWidth
    const containerWidth = this.containerElement.offsetWidth
    let navTranslateX = 0
    let navIsMinimized = false
    let editorWidth = `${containerWidth - this.navWidth}px`

    // Setting dimensions based on font-size.
    this.padding = parseInt(window.getComputedStyle(document.body).fontSize, 10) * 3
    const editorPaneMinWidth = parseInt(window.getComputedStyle(this.editorPaneElement, null).minWidth, 10)

    const diff = editorPaneWidth - this.navWidth

    // Check if we need to push the navbar outside view
    if (diff < 0) {
      navTranslateX = Math.min(containerWidth - editorPaneMinWidth - this.navWidth, 0)
      navIsMinimized = true
      editorWidth = `${containerWidth - navTranslateX - this.navWidth}px`
    }

    // Set states that triggers re-render
    this.setState({
      navTranslateX: navTranslateX,
      navIsMinimized: navIsMinimized,
      editorWidth: editorWidth
    })

    return false
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

    const documentsPane = selectedType && this.getDocumentsPane(selectedType)

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
          id="Sanity_Default_DeskTool_Editor_ScrollContainer"
          style={{
            width: editorWidth,
            transform: `translateX(${editorTranslateX}px)`
          }}
        >
          {
            selectedType && selectedDocumentId && (
              <EditorPane
                documentId={selectedDocumentId && UrlDocId.decode(selectedDocumentId)}
                typeName={selectedType}
              />
            )
          }
          {
            !selectedType && (
              <h2 className={styles.emptyText}>Select a type to begin…</h2>
            )
          }
          <div>&nbsp;</div>
        </div>
      </div>
    )
  }
})
