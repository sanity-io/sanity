import {rm} from 'fs/promises'
import {cleanupDangling} from './cleanupDangling'
import {
  baseTestPath,
  cliUserToken,
  getTestRunArgs,
  hasBuiltCli,
  studioVersions,
  testClient,
} from './environment'

export default async function globalTeardown(): Promise<void> {
  if (!cliUserToken || !hasBuiltCli) {
    return
  }

  for (const version of studioVersions) {
    const args = getTestRunArgs(version)
    await deleteCorsOrigins(args.corsOrigin)
    await deleteAliases(args.alias)
    await deleteGraphQLAPIs(args.graphqlDataset)
    await deleteDatasets(args)
  }

  await rm(baseTestPath, {recursive: true, force: true})

  // Very hacky, but good enough for now:
  // Force a cleanup of dangling entities left over from previous test runs
  await cleanupDangling()
}

function getErrorWarner(entity: string, id: string) {
  return (err: unknown) => {
    if (err instanceof Error) {
      console.warn(`WARN: ${entity} "${id}" cleanup failed: ${err.message}`)
    } else {
      console.warn(`WARN: ${entity} "${id}" cleanup failed: ${err}`)
    }
  }
}

async function deleteAliases(baseAlias: string) {
  const aliases = await testClient.request<{name: string}[]>({url: '/aliases'})
  const created = aliases.filter(({name}) => name.startsWith(baseAlias))
  await Promise.all(
    created.map((alias) =>
      testClient
        .request({method: 'DELETE', uri: `/aliases/${alias.name}`})
        .catch(getErrorWarner('dataset alias', alias.name)),
    ),
  )
}

async function deleteGraphQLAPIs(graphqlDataset: string) {
  const apis = await testClient.request<{dataset: string; tag: string}[]>({url: '/apis/graphql'})
  const created = apis.filter(({dataset}) => dataset === graphqlDataset)
  await Promise.all(
    created.map(({dataset, tag}) =>
      testClient
        .request({url: `/apis/graphql/${dataset}/${tag}`, method: 'DELETE'})
        .catch(getErrorWarner('graphql api', `${dataset}/${tag}`)),
    ),
  )
}

async function deleteCorsOrigins(baseOrigin: string) {
  const origins = await testClient.request<{id: number; origin: string}[]>({url: '/cors'})
  const created = origins.filter(({origin}) => origin.startsWith(baseOrigin))
  await Promise.all(
    created.map((origin) =>
      testClient
        .request({method: 'DELETE', uri: `/cors/${origin.id}`})
        .catch(getErrorWarner('cors origin', origin.origin)),
    ),
  )
}

async function deleteDatasets(args: ReturnType<typeof getTestRunArgs>) {
  const datasets = [
    args.dataset,
    args.datasetCopy,
    args.documentsDataset,
    args.graphqlDataset,
    args.aclDataset,
  ]

  await Promise.all(
    datasets.map((ds) => testClient.datasets.delete(ds).catch(getErrorWarner('dataset', ds))),
  )
}
