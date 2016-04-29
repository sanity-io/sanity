import React from 'react'
import Pane from './pane/Pane'
import QueryPane from './pane/QueryPane'
import schema from 'schema:@sanity/base/schema'
import styles from 'style:desk-tool/styles'
import PaneContainer from 'component:desk-tool/pane-container'

function getTypeItems() {
  return Object.keys(schema.types || {}).map(type => ({
    pathSegment: type,
    title: type.substr(0, 1).toUpperCase() + type.substr(1)
  }))
}

function SchemaPaneResolver({segments}) {
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
        query={`${schema.name}.${selectedType} {"pathSegment": .$id, "title": .name}`}
        activeItem={segments[1]}
        previousPathSegment={segments[0]}
      />
    )
  }

  return (
    <div className={styles.deskTool}>
      <PaneContainer>{panes}</PaneContainer>

      <main className={styles.editorContainer}>
        {selectedItem && <div>{selectedItem}</div>}
      </main>
    </div>
  )
}

export default SchemaPaneResolver
