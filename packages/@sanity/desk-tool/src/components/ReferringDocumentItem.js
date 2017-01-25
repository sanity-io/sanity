import React from 'react'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'

function ReferringDocumentItem(item) {

  const docUrlId = item._id.replace('/', '.')
  const typeName = item._type.replace(/^.+\./, '')
  const typeDef = schema.types.find(type => type.name === typeName)

  item.stateLink = {
    selectedType: typeName,
    action: 'edit',
    selectedDocumentId: docUrlId
  }

  return (
    <Preview value={item} typeDef={typeDef} />
  )
}

export default ReferringDocumentItem
