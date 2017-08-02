import buildCommand from './build/buildCommand'
import checkCommand from './check/checkCommand'
import configCheckCommand from './config/configCheckCommand'
import datasetGroup from './dataset/datasetGroup'
import deployCommand from './deploy/deployCommand'
import listDatasetsCommand from './dataset/listDatasetsCommand'
import createDatasetCommand from './dataset/createDatasetCommand'
import deleteDatasetCommand from './dataset/deleteDatasetCommand'
import exportDatasetCommand from './dataset/exportDatasetCommand'
import importDatasetCommand from './dataset/importDatasetCommand'
import documentsGroup from './documents/documentsGroup'
import getDocumentsCommand from './documents/getDocumentsCommand'
import queryDocumentsCommand from './documents/queryDocumentsCommand'
import installCommand from './install/installCommand'
import startCommand from './start/startCommand'
import uninstallCommand from './uninstall/uninstallCommand'
import hookGroup from './hook/hookGroup'
import createHookCommand from './hook/createHookCommand'
import deleteHookCommand from './hook/deleteHookCommand'
import listHooksCommand from './hook/listHooksCommand'
import printHookAttemptCommand from './hook/printHookAttemptCommand'
import listHookLogsCommand from './hook/listHookLogsCommand'

export default [
  buildCommand,
  checkCommand,
  configCheckCommand,
  datasetGroup,
  deployCommand,
  listDatasetsCommand,
  createDatasetCommand,
  exportDatasetCommand,
  importDatasetCommand,
  deleteDatasetCommand,
  hookGroup,
  listHooksCommand,
  createHookCommand,
  deleteHookCommand,
  listHookLogsCommand,
  printHookAttemptCommand,
  documentsGroup,
  getDocumentsCommand,
  queryDocumentsCommand,
  installCommand,
  startCommand,
  uninstallCommand
]
