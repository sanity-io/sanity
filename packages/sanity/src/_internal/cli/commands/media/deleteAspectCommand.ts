import {type CliCommandDefinition} from '@sanity/cli'
import {MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME} from '@sanity/types'
import {tap} from 'rxjs'

import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'

const helpText = `
Options
  --media-library-id The id of the target media library.

Examples
  # Delete the aspect named "someAspect".
  sanity media delete-aspect someAspect
`

interface DeleteAspectFlags {
  'media-library-id'?: string
  'aspect-name'?: string
}

const deleteAspectCommand: CliCommandDefinition<DeleteAspectFlags> = {
  name: 'delete-aspect',
  group: 'media',
  signature: '[ASPECT_NAME]',
  description: 'Undeploy an aspect.',
  helpText,
  action: async (args, context) => {
    const {output, chalk, apiClient} = context
    const [aspectName] = args.argsWithoutOptions

    if (typeof aspectName === 'undefined') {
      output.error('Specify an aspect name.')
      return
    }

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
                query: `*[_type == $type && _id == $id]`,
                params: {
                  id: aspectName,
                  type: MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME,
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
            output.print(`  - ${aspectName}`)
            output.print()
            output.print(chalk.red(error.message))
          },
          next(response) {
            if (response.results.length === 0) {
              output.print()
              output.warn(chalk.bold(`There's no deployed aspect with that name`))
              output.print(`  - ${aspectName}`)
              return
            }

            output.print()
            output.success(chalk.bold(`Deleted aspect`))
            output.print(`  - ${aspectName}`)
          },
        }),
      )
      .subscribe()

    // TODO: Find existing aspect definition files matching the undeployed aspect name and offer
    // to delete them.
  },
}

export default deleteAspectCommand
