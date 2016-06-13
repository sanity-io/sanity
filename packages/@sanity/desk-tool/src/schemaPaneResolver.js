import React, {PropTypes} from 'react'
import Pane from 'component:desk-tool/pane'
import QueryPane from 'component:desk-tool/query-pane'
import schema from 'schema:@sanity/base/schema'
import PaneContainer from 'component:desk-tool/pane-container'
import EditorContainer from 'component:desk-tool/editor-container'
import styles from '../styles/DeskTool.css'

function getTypeItems() {
  return (schema.types || []).map(type => ({
    pathSegment: type.name,
    title: type.name.substr(0, 1).toUpperCase() + type.name.substr(1)
  }))
}

const looksLikeDisplayField = field => ['name', 'title'].indexOf(field.name) !== -1

class SchemaPaneResolver extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.location !== nextProps.location
  }

  getPaneQuery(typeName) {
    const type = schema.types.find(currType => currType.name === typeName)
    const displayField = type.displayField
      ? type.fields.find(field => field.name === type.displayField)
      : type.fields.find(looksLikeDisplayField)

    const fieldName = displayField && displayField.name || 'title'
    const selection = `{"pathSegment": .$id, "title": .${fieldName}}`
    return `${schema.name}.${typeName} ${selection}`
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
