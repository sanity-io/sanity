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
import installCommand from './install/installCommand'
import startCommand from './start/startCommand'
import uninstallCommand from './uninstall/uninstallCommand'

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
  installCommand,
  startCommand,
  uninstallCommand
]
