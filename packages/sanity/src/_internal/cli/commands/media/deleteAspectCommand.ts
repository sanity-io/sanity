import {type CliCommandDefinition} from '@sanity/cli'
import {tap} from 'rxjs'

import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'

const helpText = `
Options
  --media-library-id The id of the target media library.
  --no-dry-run       Run without dry-run mode enabled.

Examples
  # Delete the aspect named "someAspectId".
  sanity media delete-aspect someAspectId
`

interface DeleteAspectFlags {
  'media-library-id'?: string
  'aspect-id'?: string
  'no-dry-run'?: boolean
}

const deleteAspectCommand: CliCommandDefinition<DeleteAspectFlags> = {
  name: 'delete-aspect',
  group: 'media',
  signature: '[ASPECT_NAME]',
  description: 'Undeploy an aspect.',
  helpText,
  action: async (args, context) => {
    const {output, chalk, apiClient} = context
    const [aspectId] = args.argsWithoutOptions
    const mediaLibraryId =
      args.extOptions['media-library-id'] ?? (await determineTargetMediaLibrary(context))
    const client = apiClient().withConfig({apiVersion: 'v2025-02-19'})

    client.observable
      .request({
        method: 'POST',
        uri: `/media-libraries/${mediaLibraryId}/mutate`,
        body: {
          mutations: [
            {
              delete: {
                query: `*[_type == "sanity.asset.aspect" && _id == $id]`,
                params: {
                  id: aspectId,
                },
              },
            },
          ],
        },
      })
      .pipe(
        tap({
          error(error) {
            output.print()
            output.error(chalk.bold('Failed to delete aspect'))
            output.print(`  - ${aspectId}`)
            output.print()
            output.print(chalk.red(error.message))
          },
          next(response) {
            if (response.results.length === 0) {
              output.print()
              output.warn(chalk.bold(`There's no deployed aspect with that name`))
              output.print(`  - ${aspectId}`)
              return
            }

            output.print()
            output.success(chalk.bold(`Deleted aspect`))
            output.print(`  - ${aspectId}`)
          },
        }),
      )
      .subscribe()

    // TODO: Find existing aspect definition files matching the undeployed aspect name and offer
    // to delete them.
  },
}

export default deleteAspectCommand
