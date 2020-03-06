/* eslint-disable react/prop-types */

import React from 'react'
import JSONPretty from 'react-json-pretty'
import monikai from 'react-json-pretty/dist/monikai'
import getDiffers from './differs/resolver'
import getChangeSummaries from './differs/bateson'
import Visualizer from './components/Visualizer'

const {summarizers, visualizers} = getDiffers()

const VisualDiff = props => {
  let original
  let modified

  if (props.document) {
    // If used directly from Structure Builder, this is how documents will be passed
    original = props.document.published
    modified = props.document.draft
  } else {
    // Suggested "official" props?
    original = props.original
    modified = props.modified
  }

  if (!original || !modified) {
    return <div>Need two documents to compare</div>
  }

  const diff = getChangeSummaries(original, modified, {summarizers})

  return (
    <div>
      <Visualizer diff={diff} visualizers={visualizers} original={original} modified={modified} />

      <hr />

      <h3>Full diff</h3>
      <JSONPretty data={diff} theme={monikai} mainStyle="white-space: pre-wrap" />

      <h3>Original</h3>
      <JSONPretty data={original} theme={monikai} mainStyle="white-space: pre-wrap" />

      <h3>Modified</h3>
      <JSONPretty data={modified} theme={monikai} mainStyle="white-space: pre-wrap" />
    </div>
  )
}

export default {
  name: 'visual-diff',
  component: VisualDiff
}
