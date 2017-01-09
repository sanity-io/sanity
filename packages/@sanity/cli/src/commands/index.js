import helpCommand from './help/helpCommand'
import initCommand from './init/initCommand'
import installCommand from './install/installCommand'
import upgradeCommand from './upgrade/upgradeCommand'
import loginCommand from './login/loginCommand'
import logoutCommand from './logout/logoutCommand'
import versionsCommand from './versions/versionsCommand'
import debugCommand from './debug/debugCommand'

export default [
  initCommand,
  loginCommand,
  logoutCommand,
  installCommand,
  upgradeCommand,
  versionsCommand,
  debugCommand,
  helpCommand
]
