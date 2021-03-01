import isValidDate from 'date-fns/isValid'
import parseDate from 'date-fns/parse'

const TRUTHY_STRINGS = ['yes', 'true', '1']
const FALSEY_STRINGS = ['false', 'no', 'false', '0', 'null']
const BOOL_STRINGS = TRUTHY_STRINGS.concat(FALSEY_STRINGS)

const TRUE = () => true

const has = (prop) => (val) => val && val[prop]
const is = (typeName) => (val) => (val && val._type) === typeName

function toLocalDate(input) {
  const newDate = new Date(input.getTime() + input.getTimezoneOffset() * 60 * 1000)
  const offset = input.getTimezoneOffset() / 60
  const hours = input.getHours()
  newDate.setHours(hours - offset)
  return newDate
}

function getTZName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (e) {} // eslint-disable-line no-empty
  return null
}

export default {
  string: {
    number: {
      test: Number,
      convert: Number,
    },
    boolean: {
      test: (value) => BOOL_STRINGS.includes(value.toLowerCase()),
      convert: (value) =>
        TRUTHY_STRINGS.includes(value.toLowerCase()) ||
        !FALSEY_STRINGS.includes(value.toLowerCase()),
    },
    richDate: {
      test: (val) => isValidDate(val),
      convert: (value) => {
        return {
          _type: 'richDate',
          local: toLocalDate(new Date(value)).toJSON(),
          utc: new Date(value).toJSON(),
          timezone: getTZName(),
          offset: new Date().getTimezoneOffset(),
        }
      },
    },
  },
  date: {
    richDate: {
      test: is('date'),
      convert: (value) => Object.assign({}, value, {_type: 'richDate'}),
    },
  },
  richDate: {
    datetime: {
      test: has('utc'),
      convert: (value) => value.utc,
    },
  },
  number: {
    string: {
      test: TRUE,
      convert: String,
    },
    boolean: {
      test: TRUE,
      convert: Number,
    },
  },
  boolean: {
    string: {
      test: TRUE,
      convert: (value) => (value ? 'Yes' : 'No'),
    },
    number: {
      test: TRUE,
      convert: Number,
    },
  },
}
