/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/require-default-props */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/no-multi-comp */

import React from 'react'
import PropTypes from 'prop-types'
import schema from 'part:@sanity/base/schema'
import {PreviewFields} from 'part:@sanity/base/preview'

function ShowTitle({title}) {
  return <span>{title}</span>
}

ShowTitle.propTypes = {title: PropTypes.string}

export default function DocTitle(props) {
  const {document} = props
  const type = schema.get(document._type)
  return (
    <PreviewFields document={document} type={type} fields={['title']}>
      {ShowTitle}
    </PreviewFields>
  )
}

DocTitle.propTypes = {
  document: PropTypes.shape({
    _type: PropTypes.string
  })
}
