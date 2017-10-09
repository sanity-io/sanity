import minimist from 'minimist'

module.exports = function parseArguments(argv = process.argv) {
  /* eslint-disable id-length */
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
    coreOptions: {
      h, help,
      d, debug,
      v, version,
    },
    extOptions, // forwarded to commands
    argsWithoutOptions, // remaining arguments
    extraArguments, // arguments after the ended argument list (--)
  }
  /* eslint-enable id-length */
}
