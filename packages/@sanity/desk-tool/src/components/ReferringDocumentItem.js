import React, {PropTypes} from 'react'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'

function ReferringDocumentItem(props) {
  const doc = props.document

  // @todo fix?
  const docUrlId = doc._id.replace('/', '.')
  const typeName = doc._type.replace(/^.+\./, '')
  const typeDef = schema.types.find(type => type.name === typeName)

  // @todo fix link
  return (
    <li>
      <a href={`/desk/${typeName}/edit/${docUrlId}`} target="_blank" rel="noopener noreferrer">
        <Preview value={doc} typeDef={typeDef} />
      </a>
    </li>
  )
}

ReferringDocumentItem.propTypes = {
  document: PropTypes.shape({
    _id: PropTypes.string,
    _type: PropTypes.string
  })
}

export default ReferringDocumentItem
