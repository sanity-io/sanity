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

export default class SchemaPaneResolver extends React.Component {

  static contextTypes = {
    router: PropTypes.object
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
    const type = schema.get(selectedType)

    return (
      <Preview
        value={item}
        style={listView}
        type={type}
      />
    )
  }

  getDocumentsPane(typeName) {
    const type = schema.get(typeName)
    const previewConfig = type.options.preview

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
          // Hack
          // Panes needs to be resized after the content is loaded
          // Look at this later
          this.handleResize()
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

  handleResize = debounceRAF(() => {

    if (!this.navigationElement || !this.editorPaneElement || !this.containerElement || this.state.navIsHovered) {
      return
    }

    // Uses the css the determine if it should reposition with an Media Query
    const computedStyle = window.getComputedStyle(this.containerElement, '::before')
    const contentValue = computedStyle.getPropertyValue('content')
    this.shouldReposition = contentValue === '"shouldReposition"' || contentValue === 'shouldReposition' // Is quoted

    if (!this.shouldReposition) {
      // reset to default and don't do more
      this.setState({
        navTranslateX: 0,
        editorWidth: '100%'
      })
      return
    }

    this.setState({
      navWidth: this.navigationElement.offsetWidth,
      editorPaneWidth: this.editorPaneElement.offsetWidth,
      containerWidth: this.containerElement.offsetWidth
    })

    const {navWidth, editorPaneWidth, containerWidth} = this.state

    // Needs to be on resize because minWidth and fontSize changes when resizing font
    this.padding = parseInt(window.getComputedStyle(document.body).fontSize, 10) * 3
    const editorPaneMinWidth = parseInt(window.getComputedStyle(this.editorPaneElement, null).minWidth, 10)

    if (containerWidth >= (navWidth + editorPaneMinWidth)) {
      // Enough space. Show all
      this.setState({
        navTranslateX: 0,
        navIsMinimized: false,
        editorWidth: `${containerWidth - navWidth}px`
      })
    } else if (containerWidth < (editorPaneWidth + navWidth)) {
      const translateX = containerWidth - editorPaneMinWidth - navWidth
      this.setState({
        navTranslateX: translateX,
        navIsMinimized: true,
        editorWidth: `${containerWidth - translateX - navWidth}px`
      })
      if ((translateX * -1) <= navWidth - this.padding) {
        // this.setNavTranslateX(translateX)
      } else {
        this.setState({
          navTranslateX: (navWidth - this.padding) * -1
        })
      }
    }
  })

  handlePanesMouseEnter = event => {
    const {navTranslateX, navWidth} = this.state
    this.setState({
      oldNavTranslateX: navTranslateX,
      navInitialEdgePosition: navWidth + navTranslateX,
      navIsHovered: true
    })
  }

  handlePanesMouseLeave = event => {
    this.setState({
      navTranslateX: this.state.oldNavTranslateX,
      editorTranslateX: 0,
      navIsMinimized: true,
      navIsHovered: false
    })
  }

  handlePanesClick = event => {
    const {navWidth, oldNavTranslateX} = this.state
    const navVisibleWidth = navWidth + oldNavTranslateX
    this.setState({
      navTranslateX: 0,
      editorTranslateX: navWidth - navVisibleWidth,
      navIsMinimized: false,
      navIsClicked: true
    })
  }

  handlePanesMouseMove = event => {
    if (!this.state.navIsMinimized) {
      return
    }

    const {oldNavTranslateX, navInitialEdgePosition, navWidth} = this.state
    const travel = (event.clientX - navInitialEdgePosition) * -1

    if (travel < 20) {
      const x = 20
      const newNavTranslateX = oldNavTranslateX + x
      const navVisibleWidth = navWidth + newNavTranslateX
      this.setState({
        navTranslateX: newNavTranslateX,
        editorTranslateX: navVisibleWidth - oldNavTranslateX - navWidth
      })
    }
  }

  render() {
    const {router} = this.context
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
          onMouseMove={this.handlePanesMouseMove}
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
}
