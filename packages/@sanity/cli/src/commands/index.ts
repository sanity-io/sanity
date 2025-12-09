import {type CliCommandDefinition, type CliCommandGroupDefinition} from '../types'
import addBlueprintsCommand from './blueprints/addBlueprintsCommand'
import blueprintsGroup from './blueprints/blueprintsGroup'
import configBlueprintsCommand from './blueprints/configBlueprintsCommand'
import deployBlueprintsCommand from './blueprints/deployBlueprintsCommand'
import destroyBlueprintsCommand from './blueprints/destroyBlueprintsCommand'
import doctorBlueprintsCommand from './blueprints/doctorBlueprintsCommand'
import infoBlueprintsCommand from './blueprints/infoBlueprintsCommand'
import initBlueprintsCommand from './blueprints/initBlueprintsCommand'
import logsBlueprintsCommand from './blueprints/logsBlueprintsCommand'
import planBlueprintsCommand from './blueprints/planBlueprintsCommand'
import stacksBlueprintsCommand from './blueprints/stacksBlueprintsCommand'
import codemodCommand from './codemod/codemodCommand'
import debugCommand from './debug/debugCommand'
import browseCommand from './docs/browseCommand'
import docsGroup from './docs/docsGroup'
import readCommand from './docs/readCommand'
import searchCommand from './docs/searchCommand'
import devfunctionsCommand from './functions/devFunctionsCommand'
import envFunctionsCommand from './functions/envFunctionsCommand'
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
import getCommand from './openapi/getCommand'
import listCommand from './openapi/listCommand'
import openapiGroup from './openapi/openapiGroup'
import createProjectCommand from './projects/createProjectCommand'
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
