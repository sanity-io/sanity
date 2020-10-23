const isNode = require('detect-node')

module.exports = {
  FRONT: 'front',
  REAR: 'rear',

  ASCENDING: 'asc',
  DESCENDING: 'desc',

  DEFAULT_DEBOUNCE_MS: isNode ? 0 : 100,
  DEFAULT_LIMIT: 50,
  DEFAULT_BUFFER_FACTOR: 3,
}
