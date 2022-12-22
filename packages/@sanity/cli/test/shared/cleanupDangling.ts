/**
 * Situations can occur where cancelled test runs leave dangling resources behind.
 * This function will clean up any dangling resources from previous test runs,
 * determined by "older than 48 hours".
 */

import {testClient} from './environment'

const threshold = Date.now() - 48 * 60 * 60 * 1000

/* eslint-disable no-console */
export async function cleanupDangling(): Promise<void> {
  console.log('Performing dangling resource cleanup: dataset aliases')
  await deleteAliases()

  console.log('Performing dangling resource cleanup: GraphQL APIs')
  await deleteGraphQLAPIs()

  console.log('Performing dangling resource cleanup: CORS origins')
  await deleteCorsOrigins()

  console.log('Performing dangling resource cleanup: datasets')
  await deleteDatasets()
}

async function deleteAliases() {
  const aliases = await testClient.request<{name: string}[]>({url: '/aliases'})
  const toDelete = aliases.filter(({name}) => isTestEntityOlderThanThreshold(name))
  await Promise.all(
    toDelete.map((alias) =>
      testClient
        .request({method: 'DELETE', uri: `/aliases/${alias.name}`})
        .catch(getErrorWarner('dataset alias', alias.name))
    )
  )
}

async function deleteGraphQLAPIs() {
  const apis = await testClient.request<{dataset: string; tag: string}[]>({url: '/apis/graphql'})
  const toDelete = apis.filter(({dataset}) => isTestEntityOlderThanThreshold(dataset))
  await Promise.all(
    toDelete.map(({dataset, tag}) =>
      testClient
        .request({url: `/apis/graphql/${dataset}/${tag}`, method: 'DELETE'})
        .catch(getErrorWarner('graphql api', `${dataset}/${tag}`))
    )
  )
}

async function deleteCorsOrigins() {
  const origins = await testClient.request<{id: number; origin: string}[]>({url: '/cors'})
  const toDelete = origins.filter(({origin}) =>
    isTestEntityOlderThanThreshold(origin.replace(/^https:\/\//, ''))
  )
  await Promise.all(
    toDelete.map((origin) =>
      testClient
        .request({method: 'DELETE', uri: `/cors/${origin.id}`})
        .catch(getErrorWarner('cors origin', origin.origin))
    )
  )
}

async function deleteDatasets() {
  const datasets = await testClient.request<{name: string}[]>({url: '/datasets'})
  const toDelete = datasets.filter(({name}) => isTestEntityOlderThanThreshold(name))
  await Promise.all(
    toDelete.map((ds) =>
      testClient.datasets.delete(ds.name).catch(getErrorWarner('dataset', ds.name))
    )
  )
}

function isTestEntity(entity: string): boolean {
  return /^test[-_]\d{8}[-_]/.test(entity)
}

function isTestEntityOlderThanThreshold(entity: string): boolean {
  if (!isTestEntity(entity)) {
    return false
  }

  // test-20220929-darwin-v16-wode-11664
  // => 20220929
  const dateOnly = entity.slice(5, 13)
  // => 2022-09-29
  const date = `${dateOnly.slice(0, 4)}-${dateOnly.slice(4, 6)}-${dateOnly.slice(6, 8)}`
  // => 1664409600000
  const timestamp = Date.parse(date)

  return timestamp < threshold
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
