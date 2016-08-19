
module.exports = function createEvent(type, props) {
  return Object.assign({}, props, {
    type
  })
}
