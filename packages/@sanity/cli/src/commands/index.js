import debugCommand from './debug/debugCommand'
import docsCommand from './docs/docsCommand'
import helpCommand from './help/helpCommand'
import initCommand from './init/initCommand'
import installCommand from './install/installCommand'
import loginCommand from './login/loginCommand'
import logoutCommand from './logout/logoutCommand'
import manageCommand from './manage/manageCommand'
import upgradeCommand from './upgrade/upgradeCommand'
import versionsCommand from './versions/versionsCommand'

export default [
  initCommand,
  loginCommand,
  logoutCommand,
  installCommand,
  upgradeCommand,
  versionsCommand,
  docsCommand,
  manageCommand,
  debugCommand,
  helpCommand
]
