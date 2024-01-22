const {createSafeJsonParser} = require('@sanity/util/createSafeJsonParser')

module.exports = createSafeJsonParser({
  errorLabel: 'Error streaming dataset',
})
