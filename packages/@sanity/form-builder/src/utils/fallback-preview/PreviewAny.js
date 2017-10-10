// @flow
import React from 'react'
import {PreviewPrimitive} from './PreviewPrimitive'
import {PreviewObject} from './PreviewObject'
import {PreviewArray} from './PreviewArray'

const NO_VALUE = <PreviewPrimitive value="<no value>" />

type Props = {
  value: Array<*> | Object | number | boolean | string
}

export function PreviewAny(props: Props) {
  const {value, ...rest} = props
  switch (typeof value) {
    case 'number':
    case 'boolean':
    case 'string': {
      return <PreviewPrimitive {...rest} value={value} />
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
