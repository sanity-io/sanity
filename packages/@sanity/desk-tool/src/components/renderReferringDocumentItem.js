import React from 'react'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import StateLinkListItem from 'part:@sanity/components/lists/items/statelink'

export default function renderReferringDocumentItem(item, index, options) {
  const type = schema.get(item._type)
  const linkState = {
    selectedDocumentId: item._id,
    selectedType: type.name,
    action: 'edit'
  }
  return (
    <StateLinkListItem state={linkState}>
      <Preview value={item} type={type} />
    </StateLinkListItem>
  )
}
