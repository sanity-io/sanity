import type {SanityClient} from '@sanity/client'
import {validateDatasetAliasName} from '../../../actions/dataset/alias/validateDatasetAliasName'
import type {DatasetAliasDefinition, DatasetModificationResponse} from './types'

export const ALIAS_PREFIX = '~'

export function listAliases(client: SanityClient): Promise<DatasetAliasDefinition[]> {
  return client.request<DatasetAliasDefinition[]>({uri: '/aliases'})
}

export function createAlias(
  client: SanityClient,
  aliasName: string,
  datasetName: string | null
): Promise<DatasetModificationResponse> {
  return modify(client, 'PUT', aliasName, datasetName ? {datasetName} : undefined)
}

export function updateAlias(
  client: SanityClient,
  aliasName: string,
  datasetName: string | null
): Promise<DatasetModificationResponse> {
  return modify(client, 'PATCH', aliasName, datasetName ? {datasetName} : undefined)
}

export function unlinkAlias(
  client: SanityClient,
  aliasName: string
): Promise<DatasetModificationResponse> {
  validateDatasetAliasName(aliasName)
  return modify(client, 'PATCH', `${aliasName}/unlink`, {})
}

export function removeAlias(client: SanityClient, aliasName: string): Promise<{deleted: boolean}> {
  return modify(client, 'DELETE', aliasName)
}

function modify(
  client: SanityClient,
  method: string,
  aliasName: string,
  body?: {datasetName?: string}
) {
  return client.request({method, uri: `/aliases/${aliasName}`, body})
}
