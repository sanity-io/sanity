/* eslint-disable react/prop-types */

import React from 'react'
import JSONPretty from 'react-json-pretty'
import monikai from 'react-json-pretty/dist/monikai'
import summaryDiffers from './differs/summaryDiffers'
import visualDiffers from './differs/visualDiffers'
import createDiffSummary from './differs/bateson'
import Visualizer from './Visualizer'

const VisualDiff = props => {
  const {published: original, draft: modified} = props.document

  if (!original || !modified) {
    return <div>Need two documents to compare</div>
  }

  const diff = createDiffSummary(original, modified, {differs: summaryDiffers})

  return (
    <div>
      <Visualizer diff={diff} differs={visualDiffers} original={original} modified={modified} />

      <hr />

      <h3>Full diff</h3>
      <JSONPretty data={diff} theme={monikai} mainStyle="white-space: pre-wrap" />
    </div>
  )
}

export default VisualDiff
