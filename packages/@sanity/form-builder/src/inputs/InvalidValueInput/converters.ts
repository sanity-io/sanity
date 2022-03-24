import isValidDate from 'date-fns/isValid'

const TRUTHY_STRINGS = ['yes', 'true', '1']
const FALSEY_STRINGS = ['false', 'no', 'false', '0', 'null']
const BOOL_STRINGS = TRUTHY_STRINGS.concat(FALSEY_STRINGS)

const TRUE = (): true => true

const has = (prop: string) => (val?: Record<string, any>) => val && val[prop]
const is = (typeName: string) => (val?: Record<string, any>) => (val && val._type) === typeName

function toLocalDate(input: Date) {
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

export interface ValueConverter {
  test: NumberConstructor | ((value: any) => boolean)
  convert:
    | NumberConstructor
    | StringConstructor
    | ((value: any) => boolean | Record<string, any> | string)
}

export const converters: {[fromType: string]: {[toType: string]: ValueConverter}} = {
  string: {
    number: {
      test: Number,
      convert: Number,
    },
    boolean: {
      test: (value: any) => BOOL_STRINGS.includes(value.toLowerCase()),
      convert: (value: any) =>
        TRUTHY_STRINGS.includes(value.toLowerCase()) ||
        !FALSEY_STRINGS.includes(value.toLowerCase()),
    },
    richDate: {
      test: (value: any) => isValidDate(value),
      convert: (value: any): Record<string, any> => {
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
      convert: (value: any) => Object.assign({}, value, {_type: 'richDate'}),
    },
  },
  richDate: {
    datetime: {
      test: has('utc'),
      convert: (value: any) => value.utc,
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
      convert: (value: any) => (value ? 'Yes' : 'No'),
    },
    number: {
      test: TRUE,
      convert: Number,
    },
  },
}
