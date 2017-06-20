import PropTypes from 'prop-types'
import React from 'react'
import {PreviewPrimitive} from './PreviewPrimitive'
import {PreviewObject} from './PreviewObject'
import {PreviewArray} from './PreviewArray'

const NO_VALUE = <PreviewPrimitive value="<no value>" />

export function PreviewAny(props) {
  const {value, ...rest} = props
  switch (typeof value) {
    case 'number':
    case 'boolean':
    case 'string': {
      return <PreviewPrimitive {...rest} value={value} />
    }
    case 'undefined': {
      return NO_VALUE
    }
    case 'object': {
      if (value === null) {
        return NO_VALUE
      }

      if (Array.isArray(value)) {
        return <PreviewArray {...rest} value={value} />
      }

      return <PreviewObject {...rest} value={value} />
    }
    default: {
      return <span>{'<unknown>'}</span>
    }
  }
}

PreviewAny.defaultProps = {
  _depth: 1
}
