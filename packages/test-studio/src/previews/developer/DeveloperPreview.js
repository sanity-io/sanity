/* eslint-disable react/prop-types */

import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import JSONPretty from 'react-json-pretty'
import monikai from 'react-json-pretty/dist/monikai'
import styles from './DeveloperPreview.module.css'

function DeveloperPreview(props) {
  const {history, draft, published} = props
  const {snapshot: historical, isLoading: isLoadingHistorical} = history.document

  return (
    <div className={styles.root}>
      {isLoadingHistorical && <Spinner center message="Loading revision" />}

      <JSONPretty
        data={historical || draft || published}
        theme={monikai}
        mainStyle="white-space: pre-wrap"
      />
    </div>
  )
}

export default DeveloperPreview
