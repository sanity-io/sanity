import defaultCommands from './commands'
import cliPrompter from './prompters/cliPrompter'
import cliOutputter from './outputters/cliOutputter'

export default class CommandRunner {
  constructor(handlers = {}, commands = defaultCommands) {
    this.handlers = handlers
    this.commands = commands

    if (!handlers.outputter || !handlers.prompter) {
      throw new Error('`prompter` and `outputter` handlers must be defined')
    }
  }

  runCommand(cmdName, options) {
    const command = this.commands.find(cmd => cmd.name === cmdName)
    if (!command) {
      return this.handlers.outputter.error(new Error(`Command '${cmdName} not defined`))
    }

    const {print, error} = this.handlers.outputter
    const {prompt} = this.handlers.prompter
    command.action({print, error, prompt, options})
  }
}

export function getCliRunner(cmds) {
  return new CommandRunner({
    outputter: cliOutputter,
    prompter: cliPrompter
  }, cmds)
}
