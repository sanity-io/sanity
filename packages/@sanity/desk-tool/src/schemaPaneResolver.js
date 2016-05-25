import React, {PropTypes} from 'react'
import Pane from 'component:desk-tool/pane'
import QueryPane from 'component:desk-tool/query-pane'
import schema from 'schema:@sanity/base/schema'
import PaneContainer from 'component:desk-tool/pane-container'
import EditorContainer from 'component:desk-tool/editor-container'
import styles from '../styles/DeskTool.css'

function getTypeItems() {
  return Object.keys(schema.types || {}).map(type => ({
    pathSegment: type,
    title: type.substr(0, 1).toUpperCase() + type.substr(1)
  }))
}

class SchemaPaneResolver extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.location !== nextProps.location
  }

  getPaneQuery(type) {
    const displayField = schema.types[type].displayField || 'title'
    const selection = `{"pathSegment": .$id, "title": .${displayField}}`
    return `${schema.name}.${type} ${selection}`
  }

  render() {
    const segments = this.props.location.split('/').slice(1)
    const selectedType = segments[0]
    const selectedItem = segments[1]
    const panes = [
      <Pane
        key="types"
        items={getTypeItems()}
        activeItem={selectedType}
      />
    ]

    if (selectedType) {
      panes.push(
        <QueryPane
          key={selectedType}
          basePath={`/${selectedType}`}
          segments={segments}
          query={this.getPaneQuery(selectedType)}
          activeItem={segments[1]}
          previousPathSegment={segments[0]}
        />
      )
    }

    const editor = selectedItem && (
      <EditorContainer
        documentId={selectedItem}
        schema={schema}
        typeName={selectedType}
      />
    )

    return (
      <div className={styles.container}>
        <PaneContainer className={styles.paneContainer}>
          {panes}
        </PaneContainer>
        <main className={styles.main}>
          {editor}
        </main>
      </div>
    )
  }
}

SchemaPaneResolver.propTypes = {
  location: PropTypes.string.isRequired
}

export default SchemaPaneResolver
