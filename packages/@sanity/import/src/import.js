const fromArray = require('./importFromArray')
const fromFolder = require('./importFromFolder')
const fromStream = require('./importFromStream')
const validateOptions = require('./validateOptions')

const importers = {
  fromStream,
  fromFolder,
  fromArray,
}

module.exports = async (input, opts) => {
  const options = await validateOptions(input, opts)

  if (typeof input.pipe === 'function') {
    return fromStream(input, options, importers)
  }

  if (Array.isArray(input)) {
    return fromArray(input, options, importers)
  }

  if (typeof input === 'string') {
    return fromFolder(input, options, importers)
  }

  throw new Error('Stream does not seem to be a readable stream, an array or a path to a directory')
}
