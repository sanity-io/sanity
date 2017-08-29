import React from 'react'
import PropTypes from 'prop-types'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import {Item} from 'part:@sanity/components/lists/default'
import {StateLink} from 'part:@sanity/base/router'

function ReferringDocumentListItem(props) {
  const item = props.document
  const typeName = item._type
  const schemaType = schema.get(typeName)
  const linkState = {
    selectedDocumentId: item._id,
    selectedType: typeName,
    action: 'edit'
  }

  return (
    <Item>
      {schemaType
        ? (
          <StateLink state={linkState}>
            <Preview value={item} type={schemaType} />
          </StateLink>
        )
        : <div>A document of the unknown type <em>{typeName}</em></div>
      }
    </Item>
  )
}

ReferringDocumentListItem.propTypes = {
  document: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired
  }).isRequired
}

export default ReferringDocumentListItem
