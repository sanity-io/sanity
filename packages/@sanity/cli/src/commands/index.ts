import {type CliCommandDefinition, type CliCommandGroupDefinition} from '../types'
import codemodCommand from './codemod/codemodCommand'
import debugCommand from './debug/debugCommand'
import docsCommand from './docs/docsCommand'
import devfunctionsCommand from './functions/devFunctionsCommand'
import functionsGroup from './functions/functionsGroup'
import logsfunctionsCommand from './functions/logsFunctionsCommand'
import testfunctionsCommand from './functions/testFunctionsCommand'
import helpCommand from './help/helpCommand'
import initCommand from './init/initCommand'
import installCommand from './install/installCommand'
import learnCommand from './learn/learnCommand'
import loginCommand from './login/loginCommand'
import logoutCommand from './logout/logoutCommand'
import manageCommand from './manage/manageCommand'
import listProjectsCommand from './projects/listProjectsCommand'
import projectsGroup from './projects/projectsGroup'
import disableTelemetryCommand from './telemetry/disableTelemetryCommand'
import enableTelemetryCommand from './telemetry/enableTelemetryCommand'
import telemetryGroup from './telemetry/telemetryGroup'
import telemetryStatusCommand from './telemetry/telemetryStatusCommand'
import generateTypegenCommand from './typegen/generateTypesCommand'
import typegenGroup from './typegen/typegenGroup'
import versionsCommand from './versions/versionsCommand'

export const baseCommands: (CliCommandDefinition | CliCommandGroupDefinition)[] = [
  initCommand,
  loginCommand,
  logoutCommand,
  installCommand,
  versionsCommand,
  docsCommand,
  manageCommand,
  debugCommand,
  helpCommand,
  projectsGroup,
  learnCommand,
  listProjectsCommand,
  codemodCommand,
  telemetryGroup,
  disableTelemetryCommand,
  enableTelemetryCommand,
  telemetryStatusCommand,
  generateTypegenCommand,
  typegenGroup,
  functionsGroup,
  devfunctionsCommand,
  logsfunctionsCommand,
  testfunctionsCommand,
]
