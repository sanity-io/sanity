/* eslint-disable react/prop-types */

import React, {useContext} from 'react'
import JSONPretty from 'react-json-pretty'
import monikai from 'react-json-pretty/dist/monikai'
import styles from './DeveloperPreview.module.css'
import {PaneRouterContext} from '@sanity/desk-tool'

function DeveloperPreview(props) {
  const pane = useContext(PaneRouterContext)
  const payload = {count: 0, ...pane.payload}
  const {displayed} = props.document
  return (
    <div className={styles.root}>
      <button type="button" onClick={() => pane.setPayload({count: payload.count + 1})}>
        + {payload.count}
      </button>
      <JSONPretty data={displayed} theme={monikai} mainStyle="white-space: pre-wrap" />
    </div>
  )
}

export default DeveloperPreview
