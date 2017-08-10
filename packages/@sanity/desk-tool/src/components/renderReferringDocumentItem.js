import React from 'react'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import {StateLink} from 'part:@sanity/base/router'

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
      <StateLink state={linkState}>
        <Preview value={item} type={schemaType} />
      </StateLink>
    )
    : <div>A document of the unknown type <em>{typeName}</em></div>
}
