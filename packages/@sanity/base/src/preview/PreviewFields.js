/* eslint-disable react/no-multi-comp */

import React from 'react'
import PropTypes from 'prop-types'
import PreviewSubscriber from './PreviewSubscriber'

function arrify(val) {
  if (Array.isArray(val)) {
    return val
  }
  return (typeof val === undefined) ? [] : [val]
}

export default function PreviewFields(props) {
  return (
    <PreviewSubscriber value={props.document} type={props.type} fields={arrify(props.fields)}>
      {({snapshot}) => <span>{snapshot && props.children(snapshot)}</span>}
    </PreviewSubscriber>
  )
}

PreviewFields.propTypes = {
  document: PropTypes.object,
  fields: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  type: PropTypes.object.isRequired,
  children: PropTypes.func
}
