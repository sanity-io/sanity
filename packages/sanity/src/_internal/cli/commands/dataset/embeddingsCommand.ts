import {type CliCommandDefinition, type CliOutputter} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'

import parseApiErr from '../../actions/backup/parseApiErr'
import resolveApiClient from '../../actions/backup/resolveApiClient'

const EMBEDDINGS_API_VERSION = 'v2026-01-01'

const INITIAL_POLL_INTERVAL_MS = 10_000
const MAX_POLL_INTERVAL_MS = 10 * 60 * 1_000
const POLL_TIMEOUT_MS = 24 * 60 * 60 * 1_000

const helpText = `
Actions
  enable   Enable embeddings for a dataset
  disable  Disable embeddings for a dataset
  status   Show embeddings settings and status

Options
  --projection <groq>  GROQ projection defining which fields to embed (with enable)
  --wait               Wait for embeddings processing to complete (with enable)

Examples
  sanity dataset embeddings status production
  sanity dataset embeddings enable production
  sanity dataset embeddings enable production --projection "{ title, body }"
  sanity dataset embeddings enable production --wait
  sanity dataset embeddings disable production
`

interface EmbeddingsFlags {
  projection?: string
  wait?: boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const embeddingsCommand: CliCommandDefinition<EmbeddingsFlags> = {
  name: 'embeddings',
  group: 'dataset',
  signature: '<action> [DATASET_NAME]',
  helpText,
  description: 'Manage embeddings settings for a dataset',
  action: async (args, context) => {
    const {output, chalk} = context
    const flags = args.extOptions
    const [action, dataset] = args.argsWithoutOptions

    if (!action || !['enable', 'disable', 'status'].includes(action)) {
      throw new Error('Action must be provided (enable/disable/status)')
    }

    const {projectId, datasetName, token, client} = await resolveApiClient(
      context,
      dataset,
      EMBEDDINGS_API_VERSION,
    )

    if (action === 'status') {
      try {
        const settings = await client.request<{
          enabled: boolean
          projection?: string
          status: string
        }>({
          headers: {Authorization: `Bearer ${token}`},
          uri: `/projects/${projectId}/datasets/${datasetName}/settings/embeddings`,
        })

        output.print(`Dataset:    ${datasetName}`)
        output.print(`Embeddings: ${settings.enabled ? 'enabled' : 'disabled'}`)
        if (settings.projection) {
          output.print(`Projection: ${settings.projection}`)
        }
        output.print(`Status:     ${settings.status}`)
      } catch (error) {
        const {message} = parseApiErr(error)
        throw new Error(`Failed to get embeddings settings: ${message}`, {cause: error})
      }
    } else if (action === 'enable') {
      const {projection, wait} = flags

      try {
        await client.request({
          method: 'PUT',
          headers: {Authorization: `Bearer ${token}`},
          uri: `/projects/${projectId}/datasets/${datasetName}/settings/embeddings`,
          body: {enabled: true, ...(projection ? {projection} : {})},
        })
      } catch (error) {
        const {message} = parseApiErr(error)
        throw new Error(`Failed to enable embeddings: ${message}`, {cause: error})
      }

      output.print(chalk.green(`Embeddings enabled for dataset ${datasetName}.`))
      if (projection) {
        output.print(`Projection: ${projection}`)
      }

      if (wait) {
        await waitForReady(output, client, projectId, datasetName, token)
      } else {
        output.print('Processing documents in the background. Use --wait to wait for completion.')
      }
    } else if (action === 'disable') {
      try {
        await client.request({
          method: 'PUT',
          headers: {Authorization: `Bearer ${token}`},
          uri: `/projects/${projectId}/datasets/${datasetName}/settings/embeddings`,
          body: {enabled: false},
        })
      } catch (error) {
        const {message} = parseApiErr(error)
        throw new Error(`Failed to disable embeddings: ${message}`, {cause: error})
      }

      output.print(chalk.green(`Disabled embeddings for dataset ${datasetName}.`))
      output.print(chalk.yellow('Note: Existing embedding data will be removed.'))
    }
  },
}

async function waitForReady(
  output: CliOutputter,
  client: SanityClient,
  projectId: string,
  datasetName: string,
  token: string | undefined,
): Promise<void> {
  const spin = output.spinner('Waiting for embeddings to be ready...').start()
  const deadline = Date.now() + POLL_TIMEOUT_MS
  let interval = INITIAL_POLL_INTERVAL_MS

  try {
    while (Date.now() < deadline) {
      await sleep(interval)
      interval = Math.min(interval * 1.5, MAX_POLL_INTERVAL_MS)

      const settings = await client.request<{status: string}>({
        headers: token ? {Authorization: `Bearer ${token}`} : {},
        uri: `/projects/${projectId}/datasets/${datasetName}/settings/embeddings`,
      })

      if (settings.status === 'ready') {
        spin.succeed('Embeddings ready.')
        return
      }

      if (settings.status !== 'updating') {
        spin.fail(`Unexpected status: ${settings.status}`)
        throw new Error(`Embeddings entered unexpected status: ${settings.status}`)
      }

      spin.text = 'Still processing...'
    }

    spin.fail('Timed out waiting for embeddings.')
    throw new Error('Timed out. Check status with: sanity dataset embeddings status')
  } catch (error) {
    spin.fail()
    throw error
  }
}

export default embeddingsCommand
