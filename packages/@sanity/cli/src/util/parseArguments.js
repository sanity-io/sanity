/* eslint-disable id-length */
const minimist = require('minimist')

module.exports = function parseArguments(argv = process.argv) {
  // prettier-ignore
  const {
    _,
    h, help,
    d, debug,
    v, version,
    '--': extraArguments,
    ...extOptions
  } = minimist(argv.slice(2), {
    '--': true,
    boolean: ['h', 'help', 'd', 'debug', 'v', 'version']
  })

  const [groupOrCommand, ...argsWithoutOptions] = _

  return {
    groupOrCommand,

    // prettier-ignore
    coreOptions: {
      h, help,
      d, debug,
      v, version,
    },

    extOptions, // forwarded to commands
    argsWithoutOptions, // remaining arguments
    extraArguments, // arguments after the ended argument list (--)
  }
}
