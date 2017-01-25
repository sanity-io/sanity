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
import {previewUtils} from 'part:@sanity/form-builder'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Preview from 'part:@sanity/base/preview'

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

const TYPE_ITEMS = dataAspects.getInferredTypes().map(type => ({
  key: type.name,
  name: type.name,
  title: dataAspects.getDisplayName(type.name)
}))

function readListViewSettings() {
  return JSON.parse(window.localStorage.getItem('desk-tool.listview-settings') || '{}')
}
function writeListViewSettings(settings) {
  window.localStorage.setItem('desk-tool.listview-settings', JSON.stringify(settings))
}

export default class SchemaPaneResolver extends React.Component {

  static contextTypes = {
    router: PropTypes.object
  }

  state = {
    listViewSettings: readListViewSettings(),
    sorting: '_updatedAt desc'
  }

  navTranslateX = 0
  navMouseover = false
  navIsClosing = false

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
    this.handleResize()
    this.checkRedirect()
  }

  checkRedirect() {
    const {router} = this.context

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

  handleItemSelect = item => {
    // this.navIsClosing = true
    // this.resetNavTranslateX()
  }

  renderTypePaneItem = item => {
    const {selectedType} = this.context.router.state
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

  renderDocumentPaneItem = (item, i) => {
    const {selectedType} = this.context.router.state
    const listView = this.getListViewForType(selectedType)
    const schemaType = schema.types.find(type => type.name === selectedType)

    return (
      <Preview
        value={item}
        style={listView}
        typeDef={schemaType}
      />
    )
  }

  getDocumentsPane(typeName) {
    const type = schema.types.find(t => t.name === typeName)
    const previewConfig = previewUtils.canonicalizePreviewConfig(type)

    const {selectedType} = this.context.router.state

    const query = `${schema.name}.${type.name}[limit: 200, order: ${this.state.sorting}] {${
      previewUtils.stringifyGradientQuerySelection(previewConfig.fields)
    }}`

    return (
      <QueryContainer query={query}>
        {({result, loading, error}) => {
          if (error) {
            return (
              <FullscreenDialog kind="danger" title="An error occurred while loading items" isOpen>
                {error.message}
              </FullscreenDialog>
            )
          }
          const items = result && result.documents && result.documents.map(item => {
            item.stateLink = {selectedType, action: 'edit', selectedDocumentId: UrlDocId.encode(item._id)}
            return item
          })
          return (
            <Pane
              contentType="documents"
              type={type}
              loading={loading}
              items={items}
              onSelect={this.handleItemSelect}
              renderItem={this.renderDocumentPaneItem}
              onSetListView={this.handleSetListView}
              onSetSorting={this.handleSetSort}
              listView={this.getListViewForType(type.name)}
              onUpdate={this.handleUpdate}
            />
          )
        }}
      </QueryContainer>
    )
  }


  handleSetListView = listView => {
    const {selectedType} = this.context.router.state
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

  setNavTranslateX = x => {
    if (x === 0) {
      this.setState({
        navIsMinimized: false
      })
    } else {
      this.setState({
        navIsMinimized: true
      })
    }
    this.navigationElement.style.transform = `translateX(${x}px)`
    this.setEditorTranslateX(x)
  }

  setEditorTranslateX = x => {
    this.editorPaneElement.style.transform = `translateX(${x + this.navWidth - this.navVisibleWidth}px)`

    if (!this.state.navIsMinimized) {
      this.editorPaneElement.style.transform = `translateX(${0}px)`
    }

  }

  resetNavTranslateX = () => {
    if (this.navTranslateX) {
      this.setNavTranslateX(this.navTranslateX)
    }
  }

  handleResize = debounceRAF(() => {

    console.log('resize')

    if (!this.navigationElement || !this.editorPaneElement || !this.containerElement) {
      return
    }

    // Uses the css the determine if it should reposition with an Media Query
    const computedStyle = window.getComputedStyle(this.containerElement, '::before')
    const contentValue = computedStyle.getPropertyValue('content')
    const shouldReposition = contentValue === '"shouldReposition"' || contentValue === 'shouldReposition' // Is quoted

    if (!shouldReposition) {
      // reset to default and don't do more
      this.navTranslateX = 0
      this.setNavTranslateX(0)
      this.editorPaneElement.style.width = '100%'
      return
    }

    this.navWidth = this.navigationElement.offsetWidth
    const navWidth = this.navWidth
    const editorPaneWidth = this.editorPaneElement.offsetWidth
    const containerWidth = this.containerElement.offsetWidth

    // Needs to be on resize because minWidth and fontSize changes when resizing font
    this.padding = parseInt(window.getComputedStyle(document.body).fontSize, 10) * 3
    const editorPaneMinWidth = parseInt(window.getComputedStyle(this.editorPaneElement, null).minWidth, 10)

    if (containerWidth >= (navWidth + editorPaneMinWidth)) {
      // Enough space. Show all
      this.navTranslateX = 0
      this.setNavTranslateX(0)
      this.editorPaneElement.style.width = `${containerWidth - navWidth}px`
    } else if (containerWidth < (editorPaneWidth + navWidth)) {
      // Needs more space
      // Move navigation out of the screen to make room for the editor
      const translateX = containerWidth - editorPaneMinWidth - navWidth
      this.navTranslateX = translateX
      // this.setNavTranslateX(this.navTranslateX)
      // Resize the editor
      const newEditorWidth = containerWidth - translateX - navWidth
      this.editorPaneElement.style.width = `${newEditorWidth}px`

      if ((translateX * -1) <= navWidth - this.padding) {
        this.navTranslateX = translateX
      } else {
        this.navTranslateX = (navWidth - this.padding) * -1
      }
    }
  })

  handlePanesMouseEnter = event => {
    this.navInitialEdgePosition = this.navigationElement.offsetWidth + this.navTranslateX
  }

  handlePanesMouseLeave = event => {
    // clearTimeout(this.mouseOverInterval)
    this.navMouseover = false
    this.navIsClosing = false
    // reset to old translateX
    this.setNavTranslateX(this.navTranslateX)
  }

  handlePanesClick = event => {
    this.setNavTranslateX(0)
    this.setState({
      navIsMinimized: false
    })
  }

  handlePanesMouseMove = event => {

    if (!this.state.navIsMinimized) {
      return
    }

    const travel = (this.navInitialEdgePosition - event.clientX) / this.navInitialEdgePosition

    const width = this.navigationElement.offsetWidth
    this.navVisibleWidth = width + this.navTranslateX

    if (travel < 0.3) {
      const travelInverted = 1 - (travel * travel)
      this.setNavTranslateX(this.navTranslateX * travelInverted)
    }
  }

  handleUpdate = () => {
    // this.handleResize()
  }

  render() {
    const {router} = this.context
    const {selectedType, selectedDocumentId} = router.state

    const typesPane = (
      <TypePane
        items={TYPE_ITEMS}
        renderItem={this.renderTypePaneItem}
        onUpdate={this.handleUpdate}
      />
    )

    const documentsPane = selectedType && this.getDocumentsPane(selectedType)

    return (
      <div className={styles.container} ref={this.setContainerElement}>
        <div
          className={`
            ${this.state.navIsMinimized ? styles.navigationPanesContainerMinimized : styles.navigationPanesContainer}
          `}
          ref={this.setNavigationElement}
          onClick={this.handlePanesClick}
          onMouseEnter={this.handlePanesMouseEnter}
          onMouseMove={this.handlePanesMouseMove}
          onMouseLeave={this.handlePanesMouseLeave}
        >
          {typesPane}
          {documentsPane}
        </div>
        <div className={styles.editorContainer} ref={this.setEditorPaneElement} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
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
}
