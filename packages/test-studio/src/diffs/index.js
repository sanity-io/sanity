/* eslint-disable react/prop-types */

import React from 'react'
import JSONPretty from 'react-json-pretty'
import monikai from 'react-json-pretty/dist/monikai'
import VisualDiff from './VisualDiff'

const diffWrapper = props => {
  const {published, draft} = props.document
  console.log('pub', published)
  console.log('draft', draft)

  if (!published || !draft) {
    return <div>Need two docs</div>
  }

  return (
    <div>
      <VisualDiff originalDocument={published} modifiedDocument={draft} />
      <hr />
      <h4>Original: {published._id}</h4>
      <JSONPretty data={published} theme={monikai} mainStyle="white-space: pre-wrap" />
      <hr />
      <h4>Modified: {draft._id}</h4>
      <JSONPretty data={draft} theme={monikai} mainStyle="white-space: pre-wrap" />
    </div>
  )
}

export default diffWrapper
