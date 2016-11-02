export default id => (...args) => {
  const mod = require(id)
  return mod.__esModule ? mod.default(...args) : mod(...args)
}
