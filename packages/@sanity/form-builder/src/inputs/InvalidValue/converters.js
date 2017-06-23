const TRUTHY_STRINGS = ['yes', 'true', '1']
const FALSEY_STRINGS = ['false', 'no', 'false', '0', 'null']
const BOOL_STRINGS = TRUTHY_STRINGS.concat(FALSEY_STRINGS)

const TRUE = () => true

export default {
  string: {
    number: {
      test: Number,
      convert: Number
    },
    boolean: {
      test: value => BOOL_STRINGS.includes(value.toLowerCase()),
      convert: value => TRUTHY_STRINGS.includes(value.toLowerCase()) || !FALSEY_STRINGS.includes(value.toLowerCase())
    }
  },
  number: {
    string: {
      test: TRUE,
      convert: String
    },
    boolean: {
      test: TRUE,
      convert: Number
    }
  },
  boolean: {
    string: {
      test: TRUE,
      convert: value => value ? 'Yes' : 'No'
    },
    number: {
      test: TRUE,
      convert: Number
    }
  }
}
