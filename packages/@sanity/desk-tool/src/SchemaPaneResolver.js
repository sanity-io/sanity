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

function mapQueryResultToProps(props) {
  const {result, ...rest} = props
  return {
    items: (result ? result.documents : []),
    ...rest
  }
}

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

function stringifySelection(fields) {
  if (Array.isArray(fields)) {
    return fields.join(',')
  }
  return Object.keys(fields).map(key => {
    if (typeof fields[key] === 'undefined') {
      return null
    }
    return `"${key}":${fields[key]}`
  })
    .filter(Boolean)
    .join(',')
}


export default class SchemaPaneResolver extends React.Component {

  static contextTypes = {
    router: PropTypes.object
  }

  state = {
    listViewSettings: readListViewSettings()
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
      documentStore.create({_type: `${schema.name}.${selectedType}`}).subscribe(document => {
        router.navigate({
          action: 'create',
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

    const query = `${schema.name}.${type.name} {${stringifySelection(previewConfig.fields)}}`

    return (
      <QueryContainer query={query} mapFn={mapQueryResultToProps}>
        <Pane
          contentType="documents"
          type={type}
          renderItem={this.renderDocumentPaneItem}
          onSetListView={this.handleSetListView}
          listView={this.getListViewForType(type.name)}
          onUpdate={this.handleUpdate}
        />
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

    const navWidth = this.navigationElement.offsetWidth
    const editorPaneWidth = this.editorPaneElement.offsetWidth
    const containerWidth = this.containerElement.offsetWidth

    // Needs to be on resize because minWidth and fontSize changes when resizing font
    const padding = parseInt(window.getComputedStyle(document.body).fontSize, 10) * 2
    const editorPaneMinWidth = parseInt(window.getComputedStyle(this.editorPaneElement, null).minWidth, 10)

    if (containerWidth > (navWidth + editorPaneMinWidth)) {
      // Editor is free
      this.navigationElement.style.transform = 'translateX(0px)'
      this.editorPaneElement.style.width = `${containerWidth - navWidth}px`

    } else if (containerWidth < (editorPaneWidth + navWidth)) {
      // reset the editor
      this.editorPaneElement.style.width = 'auto'
      // Move navigation out of the screen to make room for the editor
      const translateX = containerWidth - editorPaneMinWidth - navWidth
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
              <h2>Select a type to begin…</h2>
            )
          }
          <div>&nbsp;</div>
        </div>
      </div>
    )
  }
}
