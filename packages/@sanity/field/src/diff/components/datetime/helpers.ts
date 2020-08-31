import formatDate from 'date-fns/format'
import {StringSchemaType} from '../../types'

export function getDateFormat(value: string, type: string, options: StringSchemaType['options']) {
  let format = 'YYYY-MM-DD'
  if (options && options.dateFormat) {
    format = options.dateFormat
  }

  if (type === 'date') {
    // If the type is date only
    return formatDate(value, format)
  }

  // If the type is datetime
  if (options && options.timeFormat) {
    format += ` ${options.timeFormat}`
  } else {
    format += ' HH:mm'
  }

  return formatDate(value, format)
}
