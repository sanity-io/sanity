export default (baseCommands, corePath) => {
  if (!corePath) {
    return baseCommands
  }

  const core = require(corePath)
  return baseCommands.concat(core.commands)
}
