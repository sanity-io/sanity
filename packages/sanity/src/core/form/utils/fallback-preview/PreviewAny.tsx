import React from 'react'
import {useTranslation} from '../../../i18n'
import {PreviewPrimitive} from './PreviewPrimitive'
import {PreviewObject} from './PreviewObject'
import {PreviewArray} from './PreviewArray'

const NoValue = () => {
  const {t} = useTranslation()
  return <PreviewPrimitive value={t('preview.fallback.no-value')} />
}

export interface PreviewAnyProps {
  value: Array<unknown> | Record<string, unknown> | number | boolean | string
  maxDepth: number
  _depth?: number
}

export function PreviewAny(props: PreviewAnyProps) {
  const {value, ...rest} = props

  switch (typeof value) {
    case 'number':
    case 'boolean':
    case 'string': {
      return <PreviewPrimitive {...rest} value={value} />
    }
    case 'undefined': {
      return <NoValue />
    }
    case 'object': {
      if (value === null) {
        return <NoValue />
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
