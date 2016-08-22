const applySubCommand = (yargs, cmd) => {
  if (cmd.handler || !cmd.action) {
    throw new Error(
      'Subcommands must not have a `handler`, and must have an `action`'
    )
  }

  return yargs.command(cmd)
}

const applySubCommands = subCommands =>
  yargs => subCommands.reduce(applySubCommand, yargs)

export default applySubCommands
