import React from 'react'
import format from 'date-fns/format'
import {StringSchemaType} from '../../../diff'
import {PreviewComponent} from '../../../preview/types'

export const DatetimePreview: PreviewComponent<string> = function DatetimePreview({
  value,
  schemaType
}) {
  return <>{formatDate(value, schemaType)}</>
}

function formatDate(value: string, schemaType: StringSchemaType): string {
  const {options, name} = schemaType

  let dateFormat = 'YYYY-MM-DD'
  if (options && options.dateFormat) {
    dateFormat = options.dateFormat
  }

  if (name === 'date') {
    // If the type is date only
    return format(value, dateFormat)
  }

  // If the type is datetime
  if (options && options.timeFormat) {
    dateFormat += ` ${options.timeFormat}`
  } else {
    dateFormat += ' HH:mm'
  }

  return format(value, dateFormat)
}
