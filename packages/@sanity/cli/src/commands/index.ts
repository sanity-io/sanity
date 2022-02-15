import type {CliCommandDefinition, CliCommandGroupDefinition} from '../types'
import debugCommand from './debug/debugCommand'
import docsCommand from './docs/docsCommand'
import helpCommand from './help/helpCommand'
import initCommand from './init/initCommand'
import installCommand from './install/installCommand'
import loginCommand from './login/loginCommand'
import logoutCommand from './logout/logoutCommand'
import projectsGroup from './projects/projectsGroup'
import listProjectsCommand from './projects/listProjectsCommand'
import manageCommand from './manage/manageCommand'
import upgradeCommand from './upgrade/upgradeCommand'
import versionsCommand from './versions/versionsCommand'
import codemodCommand from './codemod/codemodCommand'

export const baseCommands: (CliCommandDefinition | CliCommandGroupDefinition)[] = [
  initCommand,
  loginCommand,
  logoutCommand,
  installCommand,
  upgradeCommand,
  versionsCommand,
  docsCommand,
  manageCommand,
  debugCommand,
  helpCommand,
  projectsGroup,
  listProjectsCommand,
  codemodCommand,
]
