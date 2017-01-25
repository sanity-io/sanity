import React from 'react'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'

function ReferringDocumentItem(item) {

  const docUrlId = item._id.replace('/', '.')
  const typeName = item._type.replace(/^.+\./, '')
  const type = schema.get(typeName)

  item.stateLink = {
    selectedType: typeName,
    action: 'edit',
    selectedDocumentId: docUrlId
  }

  return (
    <Preview value={item} type={type} />
  )
}

export default ReferringDocumentItem
