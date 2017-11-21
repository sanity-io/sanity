import {find} from 'lodash'
import dynamicRequire from './dynamicRequire'

export default (baseCommands, corePath) => {
  if (!corePath) {
    return baseCommands
  }

  const core = dynamicRequire(corePath)
  const merged = baseCommands.concat(core.commands).map(addDefaultGroup)

  // Remove duplicate commands when within the same group,
  // the last defined commands with the given name wins
  return merged.reverse().reduce((cmds, cmd) => {
    if (!find(cmds, {name: cmd.name, group: cmd.group})) {
      cmds.push(cmd)
    }
    return cmds
  }, [])
}

function addDefaultGroup(cmd) {
  if (!cmd.group) {
    cmd.group = 'default'
  }

  return cmd
}
