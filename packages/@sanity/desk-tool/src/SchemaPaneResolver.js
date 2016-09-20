import React, {PropTypes} from 'react'
import Pane from 'part:@sanity/desk-tool/pane'
import schema from 'part:@sanity/base/schema'
import PaneContainer from 'part:@sanity/desk-tool/pane-container'
import {StateLink} from 'part:@sanity/base/router'
import EditorPane from './EditorPane'
import styles from '../styles/DeskTool.css'
import paneStyles from '../styles/Pane.css'
import DataAspectsResolver from 'part:@sanity/data-aspects/resolver'
import QueryContainer from 'part:@sanity/base/query-container'

const dataAspects = new DataAspectsResolver(schema)

function mapQueryResultToProps(props) {
  const {result, ...rest} = props
  return {
    items: (result ? result.documents : []).map(item => {
      item.key = item.id // mutating like a boss
      return item
    }),
    ...rest
  }
}

const TYPE_ITEMS = dataAspects.getInferredTypes().map(type => ({
  key: type.name,
  name: type.name,
  title: dataAspects.getDisplayName(type.name)
}))

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

  componentWillMount() {
    const {router} = this.context
    if (!router.state.selectedType) {
      router.navigate({
        selectedType: TYPE_ITEMS[0].name
      })
    }
  }

  handleDocumentCreated(document) {
    const {router} = this.context

    router.navigate({
      selectedType: router.state.selectedType,
      selectedDocumentId: document.id,
      action: 'edit'
    }, {replace: true})
  }

  renderTypePaneItem(type) {
    const {selectedType} = this.context.router.state
    const className = type.name === selectedType ? paneStyles.activePaneItemLink : paneStyles.paneItemLink
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
    const className = document.id === selectedDocumentId ? paneStyles.activePaneItemLink : paneStyles.paneItemLink
    return (
      <StateLink
        className={className}
        state={{selectedType, action: 'edit', selectedDocumentId: document.id}}
      >
        {document.title}
      </StateLink>
    )
  }

  getDocumentsPane(type) {
    const queryOpts = {
      typeName: type,
      keyForId: 'id',
      keyForDisplayFieldName: 'title'
    }

    const selectedTypeQuery = dataAspects.getListQuery(queryOpts)
    return (
      <QueryContainer query={selectedTypeQuery} mapFn={mapQueryResultToProps}>
        <Pane renderItem={this.renderDocumentPaneItem} />
      </QueryContainer>
    )
  }

  render() {
    const {router} = this.context
    const {selectedType, selectedDocumentId, action} = router.state

    if (!selectedType) {
      return <div>Selecting default type…</div>
    }

    const typesPane = (
      <Pane
        items={TYPE_ITEMS}
        renderItem={this.renderTypePaneItem}
      />
    )

    const documentsPane = selectedType && this.getDocumentsPane(selectedType)

    const editor = ['edit', 'create'].includes(action) && (
      <div className={styles.editor}>
        <EditorPane
          documentId={selectedDocumentId}
          typeName={selectedType}
          onCreated={this.handleDocumentCreated}
        />
      </div>
    )

    return (
      <div className={styles.container}>
        <PaneContainer className={styles.paneContainer}>
          {typesPane}
          {documentsPane}
        </PaneContainer>
        {editor && (
          <main className={styles.main}>
            {editor}
          </main>
        )}
      </div>
    )
  }
}
