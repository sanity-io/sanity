import React from 'react'
import Pane from './pane/Pane'
import QueryPane from './pane/QueryPane'
import schema from 'schema:@sanity/base/schema'

function getTypeItems() {
  return Object.keys(schema).map(type => ({
    pathSegment: type,
    title: type.substr(0, 1).toUpperCase() + type.substr(1)
  }))
}

function getPanes(segments) {
  const selectedType = segments[0]
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
        key="type-items"
        basePath={`/${selectedType}`}
        segments={segments}
        query={`${selectedType} {"pathSegment": .$id, "title": .name}`}
        activeItem={segments[1]}
        previousPathSegment={segments[0]}
      />
    )
  }

  return panes
}

export default getPanes
