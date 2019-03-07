import React from 'react'
import PropTypes from 'prop-types'
import {IntentLink} from 'part:@sanity/base/router'
import SanityPreview from 'part:@sanity/base/preview'
import QueryContainer from 'part:@sanity/base/query-container'
import Spinner from 'part:@sanity/components/loading/spinner'
import schema from 'part:@sanity/base/schema'
import IntentButton from 'part:@sanity/components/buttons/intent'
import {List, Item} from 'part:@sanity/components/lists/default'
import {intersection} from 'lodash'

import styles from './DocumentList.css'

const schemaTypeNames = schema.getTypeNames()

class DocumentList extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    types: PropTypes.arrayOf([PropTypes.string]),
    query: PropTypes.string,
    queryParams: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    order: PropTypes.string,
    limit: PropTypes.number
  }

  static defaultProps = {
    title: 'Last created',
    order: '_createdAt desc',
    limit: 10,
    types: null,
    query: null,
    queryParams: {}
  }

  assembleQuery = () => {
    const {query, queryParams, types, order, limit} = this.props

    if (query) {
      return {query, params: queryParams}
    }

    const documentTypes = schemaTypeNames.filter(typeName => {
      const schemaType = schema.get(typeName)
      return schemaType.type && schemaType.type.name === 'document'
    })

    if (types) {
      return {
        query: '*[_type in $types] | order($order) [0...$limit]',
        params: {types: intersection(types, documentTypes), order, limit}
      }
    }

    return {
      query: '*[_type in $types] | order($order) [0...$limit]',
      params: {types: documentTypes, order, limit}
    }
  }

  render() {
    const {title, types} = this.props
    const {query, params} = this.assembleQuery()

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </header>
        <List className={styles.list}>
          <QueryContainer query={query} params={params}>
            {({result, loading, error, onRetry}) => {
              if (loading) {
                return <Spinner center message="Loading items…" />
              }
              const items = result ? result.documents : []
              return items.map(item => {
                const type = schema.get(item._type)
                return (
                  <Item key={item._id}>
                    <IntentLink
                      intent="edit"
                      params={{
                        type: item._type,
                        id: item._id
                      }}
                      className={styles.link}
                    >
                      <SanityPreview layout="default" type={type} value={item} key={item._id} />
                    </IntentLink>
                  </Item>
                )
              })
            }}
          </QueryContainer>
        </List>
        {types &&
          types.length === 1 && (
            <div className={styles.buttonContainer}>
              <IntentButton
                bleed
                color="primary"
                kind="simple"
                intent="create"
                params={{type: types[0]}}
              >
                Create new {types[0]}
              </IntentButton>
            </div>
          )}
      </div>
    )
  }
}

export default DocumentList
