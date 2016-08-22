import initCommand from './init/initCommand'
import buildCommand from './build/buildCommand'
import startCommand from './start/startCommand'
import installCommand from './install/installCommand'
import uninstallCommand from './uninstall/uninstallCommand'
import datasetCommand from './dataset/datasetCommand'
import versionCommand from './version/versionCommand'
import configCheckCommand from './config/configCheckCommand'
import checkCommand from './check/checkCommand'

export default [
  initCommand,
  buildCommand,
  startCommand,
  installCommand,
  uninstallCommand,
  datasetCommand,
  checkCommand,
  configCheckCommand,
  versionCommand
]
