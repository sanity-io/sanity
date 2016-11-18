import buildCommand from './build/buildCommand'
import checkCommand from './check/checkCommand'
import configCheckCommand from './config/configCheckCommand'
import datasetGroup from './dataset/datasetGroup'
import listDatasetsCommand from './dataset/listDatasetsCommand'
import createDatasetCommand from './dataset/createDatasetCommand'
import deleteDatasetCommand from './dataset/deleteDatasetCommand'
import installCommand from './install/installCommand'
import startCommand from './start/startCommand'
import uninstallCommand from './uninstall/uninstallCommand'

export default [
  buildCommand,
  checkCommand,
  configCheckCommand,
  datasetGroup,
  listDatasetsCommand,
  createDatasetCommand,
  deleteDatasetCommand,
  installCommand,
  startCommand,
  uninstallCommand
]
