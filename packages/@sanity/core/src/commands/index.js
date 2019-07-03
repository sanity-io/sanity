import buildCommand from './build/buildCommand'
import checkCommand from './check/checkCommand'
import configCheckCommand from './config/configCheckCommand'
import datasetGroup from './dataset/datasetGroup'
import deployCommand from './deploy/deployCommand'
import undeployCommand from './deploy/undeployCommand'
import listDatasetsCommand from './dataset/listDatasetsCommand'
import createDatasetCommand from './dataset/createDatasetCommand'
import datasetVisibilityCommand from './dataset/datasetVisibilityCommand'
import deleteDatasetCommand from './dataset/deleteDatasetCommand'
import exportDatasetCommand from './dataset/exportDatasetCommand'
import importDatasetCommand from './dataset/importDatasetCommand'
import documentsGroup from './documents/documentsGroup'
import getDocumentsCommand from './documents/getDocumentsCommand'
import queryDocumentsCommand from './documents/queryDocumentsCommand'
import deleteDocumentsCommand from './documents/deleteDocumentsCommand'
import createDocumentsCommand from './documents/createDocumentsCommand'
import installCommand from './install/installCommand'
import startCommand from './start/startCommand'
import uninstallCommand from './uninstall/uninstallCommand'
import hookGroup from './hook/hookGroup'
import createHookCommand from './hook/createHookCommand'
import deleteHookCommand from './hook/deleteHookCommand'
import listHooksCommand from './hook/listHooksCommand'
import printHookAttemptCommand from './hook/printHookAttemptCommand'
import listHookLogsCommand from './hook/listHookLogsCommand'
import execCommand from './exec/execCommand'
import corsGroup from './cors/corsGroup'
import addCorsOriginCommand from './cors/addCorsOriginCommand'
import listCorsOriginsCommand from './cors/listCorsOriginsCommand'
import deleteCorsOriginCommand from './cors/deleteCorsOriginCommand'
import graphqlGroup from './graphql/graphqlGroup'
import deployGraphQLAPICommand from './graphql/deployGraphQLAPICommand'
import deleteGraphQLAPICommand from './graphql/deleteGraphQLAPICommand'
import usersGroup from './users/usersGroup'
import inviteUserCommand from './users/inviteUserCommand'
import listUsersCommand from './users/listUsersCommand'

export default [
  buildCommand,
  checkCommand,
  configCheckCommand,
  datasetGroup,
  deployCommand,
  undeployCommand,
  listDatasetsCommand,
  createDatasetCommand,
  datasetVisibilityCommand,
  exportDatasetCommand,
  importDatasetCommand,
  deleteDatasetCommand,
  corsGroup,
  listCorsOriginsCommand,
  addCorsOriginCommand,
  deleteCorsOriginCommand,
  usersGroup,
  inviteUserCommand,
  listUsersCommand,
  hookGroup,
  listHooksCommand,
  createHookCommand,
  deleteHookCommand,
  listHookLogsCommand,
  printHookAttemptCommand,
  documentsGroup,
  getDocumentsCommand,
  queryDocumentsCommand,
  deleteDocumentsCommand,
  createDocumentsCommand,
  graphqlGroup,
  deployGraphQLAPICommand,
  deleteGraphQLAPICommand,
  installCommand,
  startCommand,
  uninstallCommand,
  execCommand
]
