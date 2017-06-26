import React from 'react'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import StateLinkListItem from 'part:@sanity/components/lists/items/statelink'

export default function renderReferringDocumentItem(item, index, options) {
  const typeName = item._type
  const schemaType = schema.get(typeName)
  const linkState = {
    selectedDocumentId: item._id,
    selectedType: typeName,
    action: 'edit'
  }

  return schemaType
    ? (
      <StateLinkListItem state={linkState}>
        <Preview value={item} type={schemaType} />
      </StateLinkListItem>
    )
    : <div>A document of an of the unknown type <em>{item._type}</em></div>
}
