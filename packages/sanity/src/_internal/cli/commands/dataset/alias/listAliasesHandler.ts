import type {CliCommandAction} from '@sanity/cli'
import * as aliasClient from './datasetAliasesClient'
import {ALIAS_PREFIX} from './datasetAliasesClient'

export const listAliasesHandler: CliCommandAction = async (args, context) => {
  const {apiClient, output} = context
  const client = apiClient()

  const aliases = await aliasClient.listAliases(client)
  output.print(
    aliases
      .map((set) => `${ALIAS_PREFIX}${set.name} -> ${set.datasetName || '<unlinked>'}`)
      .join('\n'),
  )
}
