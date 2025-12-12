import {type CliCommandDefinition, type CliCommandGroupDefinition} from '../types.ts'
import addBlueprintsCommand from './blueprints/addBlueprintsCommand.ts'
import blueprintsGroup from './blueprints/blueprintsGroup.ts'
import configBlueprintsCommand from './blueprints/configBlueprintsCommand.ts'
import deployBlueprintsCommand from './blueprints/deployBlueprintsCommand.ts'
import destroyBlueprintsCommand from './blueprints/destroyBlueprintsCommand.ts'
import doctorBlueprintsCommand from './blueprints/doctorBlueprintsCommand.ts'
import infoBlueprintsCommand from './blueprints/infoBlueprintsCommand.ts'
import initBlueprintsCommand from './blueprints/initBlueprintsCommand.ts'
import logsBlueprintsCommand from './blueprints/logsBlueprintsCommand.ts'
import planBlueprintsCommand from './blueprints/planBlueprintsCommand.ts'
import stacksBlueprintsCommand from './blueprints/stacksBlueprintsCommand.ts'
import codemodCommand from './codemod/codemodCommand.ts'
import debugCommand from './debug/debugCommand.ts'
import browseCommand from './docs/browseCommand.ts'
import docsGroup from './docs/docsGroup.ts'
import readCommand from './docs/readCommand.ts'
import searchCommand from './docs/searchCommand.ts'
import devfunctionsCommand from './functions/devFunctionsCommand.ts'
import envFunctionsCommand from './functions/envFunctionsCommand.ts'
import functionsGroup from './functions/functionsGroup.ts'
import logsfunctionsCommand from './functions/logsFunctionsCommand.ts'
import testfunctionsCommand from './functions/testFunctionsCommand.ts'
import helpCommand from './help/helpCommand.ts'
import initCommand from './init/initCommand.ts'
import installCommand from './install/installCommand.ts'
import learnCommand from './learn/learnCommand.ts'
import loginCommand from './login/loginCommand.ts'
import logoutCommand from './logout/logoutCommand.ts'
import manageCommand from './manage/manageCommand.ts'
import configureMcpCommand from './mcp/configureMcpCommand.ts'
import mcpGroup from './mcp/mcpGroup.ts'
import getCommand from './openapi/getCommand.ts'
import listCommand from './openapi/listCommand.ts'
import openapiGroup from './openapi/openapiGroup.ts'
import createProjectCommand from './projects/createProjectCommand.ts'
import listProjectsCommand from './projects/listProjectsCommand.ts'
import projectsGroup from './projects/projectsGroup.ts'
import disableTelemetryCommand from './telemetry/disableTelemetryCommand.ts'
import enableTelemetryCommand from './telemetry/enableTelemetryCommand.ts'
import telemetryGroup from './telemetry/telemetryGroup.ts'
import telemetryStatusCommand from './telemetry/telemetryStatusCommand.ts'
import generateTypegenCommand from './typegen/generateTypesCommand.ts'
import typegenGroup from './typegen/typegenGroup.ts'
import versionsCommand from './versions/versionsCommand.ts'

export const baseCommands: (CliCommandDefinition | CliCommandGroupDefinition)[] = [
  initCommand,
  loginCommand,
  logoutCommand,
  installCommand,
  versionsCommand,
  docsGroup,
  browseCommand,
  searchCommand,
  readCommand,
  manageCommand,
  debugCommand,
  helpCommand,
  openapiGroup,
  listCommand,
  getCommand,
  projectsGroup,
  learnCommand,
  listProjectsCommand,
  createProjectCommand,
  codemodCommand,
  telemetryGroup,
  disableTelemetryCommand,
  enableTelemetryCommand,
  telemetryStatusCommand,
  mcpGroup,
  configureMcpCommand,
  generateTypegenCommand,
  typegenGroup,
  functionsGroup,
  devfunctionsCommand,
  logsfunctionsCommand,
  testfunctionsCommand,
  envFunctionsCommand,
  blueprintsGroup,
  addBlueprintsCommand,
  configBlueprintsCommand,
  deployBlueprintsCommand,
  destroyBlueprintsCommand,
  doctorBlueprintsCommand,
  infoBlueprintsCommand,
  initBlueprintsCommand,
  logsBlueprintsCommand,
  planBlueprintsCommand,
  stacksBlueprintsCommand,
]
