const fromStream = require('./importFromStream')
const fromFolder = require('./importFromFolder')
const fromArray = require('./importFromArray')
const validateOptions = require('./validateOptions')

const importers = {
  fromStream,
  fromFolder,
  fromArray
}

module.exports = (input, opts) => {
  const options = validateOptions(input, opts)

  return Array.isArray(input)
    ? fromArray(input, options, importers)
    : fromStream(input, options, importers)
}
