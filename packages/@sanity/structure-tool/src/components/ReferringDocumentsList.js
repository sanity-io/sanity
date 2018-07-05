import React from 'react'
import PropTypes from 'prop-types'
import {List as DefaultList, Item as DefaultItem} from 'part:@sanity/components/lists/default'
import styles from './styles/ReferringDocumentsList.css'
import Preview from 'part:@sanity/base/preview'
import {IntentLink} from 'part:@sanity/base/router'
import schema from 'part:@sanity/base/schema'

export default function ReferringDocumentsList(props) {
  const {documents} = props
  return (
    <DefaultList className={styles.root}>
      {documents.map(document => {
        const schemaType = schema.get(document._type)
        return (
          <DefaultItem className={styles.item} key={document._id}>
            {schemaType ? (
              <IntentLink
                className={styles.link}
                intent="edit"
                params={{id: document._id, type: document._type}}
              >
                <Preview value={document} type={schemaType} />
              </IntentLink>
            ) : (
              <div>
                A document of the unknown type <em>{document._type}</em>
              </div>
            )}
          </DefaultItem>
        )
      })}
    </DefaultList>
  )
}

ReferringDocumentsList.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      _type: PropTypes.string
    })
  )
}
