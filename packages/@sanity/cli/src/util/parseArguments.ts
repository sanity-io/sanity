import minimist from 'minimist'

export interface ParsedArguments<F = Record<string, string>> {
  /**
   * Group or command name, eg `dataset` (`sanity dataset`) or `import` (`sanity dataset import`)
   */
  groupOrCommand: string

  // Raw, forwarded arguments, for commands that want to be more explicit about parsing
  argv: string[]

  /**
   * Command flags, without the core options (help, debug, version etc)
   */
  extOptions: F

  /**
   * Command arguments, eg any arguments after `sanity <command>` (no flags)
   */
  argsWithoutOptions: string[]

  /**
   * Arguments after the ended argument list (--)
   */
  extraArguments: string[]

  /**
   * Options mostly relevant for the core CLI runner
   */
  coreOptions: {
    h: boolean
    help: boolean

    d: boolean
    debug: boolean

    v: boolean
    version: boolean
  }
}

export function parseArguments(argv = process.argv): ParsedArguments {
  /* eslint-disable id-length */
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

    argv,
    extOptions,
    argsWithoutOptions,
    extraArguments: extraArguments || [],

    // prettier-ignore
    coreOptions: {
      h, help,
      d, debug,
      v, version,
    },
  }
  /* eslint-enable id-length */
}
