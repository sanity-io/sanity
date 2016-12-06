import React, {PropTypes} from 'react'
import Pane from 'part:@sanity/desk-tool/pane'
import TypePane from './pane/TypePane'
import EditorPane from './pane/EditorPane'
import TypePaneItem from './pane/TypePaneItem.js'
import DocumentPaneItem from './pane/DocumentPaneItem.js'
import QueryContainer from 'part:@sanity/base/query-container'

import UrlDocId from './utils/UrlDocId'
import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import documentStore from 'part:@sanity/base/datastore/document'
import styles from './styles/SchemaPaneResolver.css'
import {previewUtils} from 'part:@sanity/form-builder'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'

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
      documentStore.create({_type: `${schema.name}.${selectedType}`}).subscribe(result => {
        router.navigate({
          action: 'edit',
          selectedType: selectedType,
          selectedDocumentId: UrlDocId.encode(result.documentId)
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
      />
    )
  }

  renderDocumentPaneItem = (item, i) => {
    const {selectedType, selectedDocumentId} = this.context.router.state
    const selected = UrlDocId.encode(item._id) === selectedDocumentId
    const listView = this.getListViewForType(selectedType)

    const linkState = {selectedType, action: 'edit', selectedDocumentId: UrlDocId.encode(item._id)}

    const schemaType = schema.types.find(type => type.name === selectedType)
    return (
      <DocumentPaneItem
        document={item}
        selected={selected}
        linkState={linkState}
        listView={listView}
        schemaType={schemaType}
      />
    )
  }

  getDocumentsPane(typeName) {
    const type = schema.types.find(t => t.name === typeName)
    const previewConfig = previewUtils.canonicalizePreviewConfig(type)

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
          return (
            <Pane
              contentType="documents"
              type={type}
              loading={loading}
              items={result ? result.documents : []}
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

  handleResize = debounceRAF(() => {
    if (!this.navigationElement || !this.editorPaneElement || !this.containerElement) {
      return
    }

    // Uses the css the determine if it should reposition with an Media Query
    const computedStyle = window.getComputedStyle(this.containerElement, '::before')
    const contentValue = computedStyle.getPropertyValue('content')
    const shouldReposition = contentValue === '"shouldReposition"' || contentValue === 'shouldReposition' // Is quoted

    if (!shouldReposition) {
      // reset to default and don't do more
      this.navigationElement.style.transform = 'translateX(0px)'
      this.editorPaneElement.style.width = '100%'
      return
    }


    const navWidth = this.navigationElement.offsetWidth
    const editorPaneWidth = this.editorPaneElement.offsetWidth
    const containerWidth = this.containerElement.offsetWidth

    // Needs to be on resize because minWidth and fontSize changes when resizing font
    const padding = parseInt(window.getComputedStyle(document.body).fontSize, 10) * 2
    const editorPaneMinWidth = parseInt(window.getComputedStyle(this.editorPaneElement, null).minWidth, 10)

    if (containerWidth >= (navWidth + editorPaneMinWidth)) {
      // Enough space. Show all
      this.navigationElement.style.transform = 'translateX(0px)'
      this.editorPaneElement.style.width = `${containerWidth - navWidth}px`
    } else if (containerWidth < (editorPaneWidth + navWidth)) {
      // Needs more space
      // Move navigation out of the screen to make room for the editor
      const translateX = containerWidth - editorPaneMinWidth - navWidth
      // Resize the editor
      const newEditorWidth = containerWidth - translateX - navWidth
      this.editorPaneElement.style.width = `${newEditorWidth}px`

      if ((translateX * -1) <= navWidth - padding) {
        this.navigationElement.style.transform = `translateX(${translateX}px)`
      } else {
        this.navigationElement.style.transform = `translateX(${(navWidth - padding) * -1}px)`
      }

    }
  })

  handleUpdate = () => {
    this.handleResize()
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
        <div className={styles.navigationPanesContainer} ref={this.setNavigationElement}>
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
