import React from 'react'
import PropTypes from 'prop-types'
import styles from './index.css'
import {partition} from 'lodash'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import QueryContainer from 'part:@sanity/base/query-container'
import Spinner from 'part:@sanity/components/loading/spinner'
import schema from 'part:@sanity/base/schema'
import {StateLink} from 'part:@sanity/base/router'

import {
  getPublishedId,
  isDraftId,
  isPublishedId,
  getDraftId
} from 'part:@sanity/base/util/draft-utils'

class DocumentList extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    query: PropTypes.string
  }

  static defaultProps = {
    title: 'Last created',
    query: `*[!(_id in path("_.**")) && _type != 'sanity.imageAsset' && _type == 'book'] | order(_createdAt desc) [0...10]`
  }

  render() {
    const {title, query} = this.props

    return (
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <QueryContainer query={query}>
          {({result, loading, error, onRetry}) => {
            if (loading) {
              return <Spinner message="Loading items…" />
            }
            const items = result ? result.documents : []

            return items.map(item => {
              const type = schema.get(item._type)

              return (
                <SanityDefaultPreview
                  layout="default"
                  type={type}
                  value={item}
                  key={item._id}
                />
              )
            })
          }}
        </QueryContainer>
      </div>
    )
  }
}

export default {
  name: 'document-list',
  component: DocumentList
}
