/* eslint-disable react/prop-types */

import React from 'react'
import JSONPretty from 'react-json-pretty'
import monikai from 'react-json-pretty/dist/monikai'
import styles from './DeveloperPreview.module.css'

function DeveloperPreview(props) {
  const {displayed} = props.document
  return (
    <div className={styles.root}>
      <JSONPretty data={displayed} theme={monikai} mainStyle="white-space: pre-wrap" />
    </div>
  )
}

export default DeveloperPreview
