import React, {PropTypes} from 'react'
import Pane from 'part:@sanity/desk-tool/pane'
import PaneContainer from 'part:@sanity/desk-tool/pane-container'
import EditorPane from './pane/EditorPane'
import PaneItem from './pane/PaneItem.js'
import QueryContainer from 'part:@sanity/base/query-container'
import styles from '../styles/DeskTool.css'
import UrlDocId from './utils/UrlDocId'
import dataAspects from './utils/dataAspects'

function mapQueryResultToProps(props) {
  const {result, ...rest} = props
  return {
    items: (result ? result.documents : []),
    ...rest
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

  render() {
    const {router} = this.context
    const {selectedType, selectedDocumentId, action} = router.state

    const typesPane = (
      <Pane
        items={TYPE_ITEMS}
        contentType="types"
        renderItem={this.renderTypePaneItem}
      />
    )

    const documentsPane = selectedType ? this.getDocumentsPane(selectedType) : (
      <div>Select a type to begin…</div>
    )


    const editor = ['edit', 'create'].includes(action) && (
      <EditorPane
        documentId={selectedDocumentId && UrlDocId.decode(selectedDocumentId)}
        typeName={selectedType}
        onCreated={this.handleDocumentCreated}
      />
    )

    return (
      <div className={styles.container}>
        <PaneContainer className={styles.paneContainer}>
          {typesPane}
          {documentsPane}
        </PaneContainer>
        {editor}
      </div>
    )
  }
}
