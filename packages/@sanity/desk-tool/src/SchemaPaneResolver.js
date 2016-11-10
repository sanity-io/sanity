import React, {PropTypes} from 'react'
import Pane from 'part:@sanity/desk-tool/pane'
import EditorPane from './pane/EditorPane'
import PaneItem from './pane/PaneItem.js'
import QueryContainer from 'part:@sanity/base/query-container'
import UrlDocId from './utils/UrlDocId'
import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import documentStore from 'part:@sanity/base/datastore/document'
import styles from './styles/SchemaPaneResolver.css'

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

function getTitleKey(type) {
  return dataAspects.getItemDisplayField(type)
}

export default class SchemaPaneResolver extends React.Component {
  static contextTypes = {
    router: PropTypes.object
  };

  constructor() {
    super()
    this.renderDocumentPaneItem = this.renderDocumentPaneItem.bind(this)
    this.renderTypePaneItem = this.renderTypePaneItem.bind(this)
    this.handleDocumentCreated = this.handleDocumentCreated.bind(this)
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

  handleDocumentCreated(document) {
    const {router} = this.context

    router.navigate({
      selectedType: router.state.selectedType,
      selectedDocumentId: UrlDocId.encode(document._id),
      action: 'edit'
    }, {replace: true})
  }

  renderTypePaneItem(item) {
    const {selectedType} = this.context.router.state
    const selected = item.name === selectedType

    return (
      <PaneItem
        key={item.key}
        item={{name: item.title}}
        linkState={{selectedType: item.name}}
        selected={selected}
        view="default"
      />
    )
  }

  renderDocumentPaneItem(item, i) {
    const {selectedType, selectedDocumentId} = this.context.router.state
    const selected = UrlDocId.encode(item._id) === selectedDocumentId

    return (
      <PaneItem
        key={item._id}
        item={item}
        linkState={{selectedType, action: 'edit', selectedDocumentId: UrlDocId.encode(item._id)}}
        index={i}
        selected={selected}
        listView={this.handleGetListViewForType(selectedType)}
      />
    )
  }

  getDocumentsPane(type) {
    const selectedTypeQuery = dataAspects.getListQuery({
      typeName: type,
      keyForId: '_id',
      keyForDisplayFieldName: getTitleKey(type)
    })

    return (
      <QueryContainer query={selectedTypeQuery} mapFn={mapQueryResultToProps}>
        <Pane
          contentType="documents"
          type={type}
          renderItem={this.renderDocumentPaneItem}
          onSetListView={this.handleSetListView}
          onGetListView={this.handleGetListViewForType}
          onUpdate={this.handleUpdate}
        />
      </QueryContainer>
    )
  }


  handleSetListView = (type, listView) => {
    window.localStorage.setItem(`desk-tool.listview.${type}`, listView)
  }

  handleGetListViewForType(type) {
    const listView = window.localStorage.getItem(`desk-tool.listview.${type}`)
    return listView || 'default'
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

    // Needs to be on resize because minWidth changes when resizing font
    const editorPaneMinWidth = parseInt(window.getComputedStyle(this.editorPaneElement, null).minWidth.split('px')[0], 10)

    if (containerWidth > (navWidth + editorPaneMinWidth)) {
      // Editor is free
      this.navigationElement.style.transform = 'translateX(0px)'
      this.editorPaneElement.style.width = `${containerWidth - navWidth}px`

    } else if (containerWidth < (editorPaneWidth + navWidth)) {
      // reset the editor
      this.editorPaneElement.style.width = 'auto'
      // Move navigation out of the screen to make room for the editor
      const translateX = containerWidth - editorPaneMinWidth - navWidth
      this.navigationElement.style.transform = `translateX(${translateX}px)`
    }
  })

  handleUpdate = () => {
    this.handleResize()
  }

  render() {
    const {router} = this.context
    const {selectedType, selectedDocumentId} = router.state

    const typesPane = (
      <Pane
        items={TYPE_ITEMS}
        contentType="types"
        renderItem={this.renderTypePaneItem}
        onUpdate={this.handleUpdate}
      />
    )

    const documentsPane = selectedType ? this.getDocumentsPane(selectedType) : (
    <h2>Select a type to begin…</h2>
    )

    return (
      <div className={styles.container} ref={this.setContainerElement}>
        <div className={styles.navigationPanesContainer} ref={this.setNavigationElement}>
          {typesPane}
          {documentsPane}
        </div>
        <div className={styles.editorContainer} ref={this.setEditorPaneElement} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
          {selectedType && (
            <EditorPane
              documentId={selectedDocumentId && UrlDocId.decode(selectedDocumentId)}
              typeName={selectedType}
          />)}
        </div>
      </div>
    )
  }
}
