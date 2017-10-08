import React from 'react'
import PropTypes from 'prop-types'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './styles/ReferringDocumentLink.css'

export default function ReferringDocumentLink(props) {
  const {document} = props
  const schemaType = schema.get(document._type)
  return schemaType
    ? (
      <IntentLink className={styles.root} intent="edit" params={{id: document._id, type: document._type}}>
        <Preview value={document} type={schemaType} />
      </IntentLink>
    )
    : <div>A document of the unknown type <em>{document._type}</em></div>
}

ReferringDocumentLink.propTypes = {
  document: PropTypes.shape({
    _id: PropTypes.string,
    _type: PropTypes.string
  })
}
