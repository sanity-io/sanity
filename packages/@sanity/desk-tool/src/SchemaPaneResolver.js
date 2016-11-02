import React, {PropTypes} from 'react'
import Pane from 'part:@sanity/desk-tool/pane'
import PaneContainer from 'part:@sanity/desk-tool/pane-container'
import {StateLink} from 'part:@sanity/base/router'
import EditorPane from './pane/EditorPane'
import QueryContainer from 'part:@sanity/base/query-container'

import paneItemStyles from './pane/styles/PaneItem.css'
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

  renderTypePaneItem(type) {
    const {selectedType} = this.context.router.state
    const className = type.name === selectedType ? paneItemStyles.activeLink : paneItemStyles.link
    return (
      <StateLink
        className={className}
        state={{selectedType: type.name}}
      >
        {type.title}
      </StateLink>
    )
  }

  renderDocumentPaneItem(document) {
    const {selectedType, selectedDocumentId} = this.context.router.state
    const className = document._id === selectedDocumentId ? paneItemStyles.activeLink : paneItemStyles.link

    return (
      <StateLink
        className={className}
        state={{selectedType, action: 'edit', selectedDocumentId: UrlDocId.encode(document._id)}}
      >
        {document[getTitleKey(selectedType)]}
      </StateLink>
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
        <Pane contentType="documents" renderItem={this.renderDocumentPaneItem} />
      </QueryContainer>
    )
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
