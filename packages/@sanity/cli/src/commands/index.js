import helpCommand from './help/helpCommand'
import initCommand from './init/initCommand'
import installCommand from './install/installCommand'
import loginCommand from './login/loginCommand'
import logoutCommand from './logout/logoutCommand'
import versionsCommand from './versions/versionsCommand'

export default [
  initCommand,
  loginCommand,
  logoutCommand,
  installCommand,
  versionsCommand,
  helpCommand
]
