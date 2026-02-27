import {type CliCommandAction} from '@sanity/cli'
import {MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME} from '@sanity/types'
import {tap} from 'rxjs'

import {MINIMUM_API_VERSION} from './constants'
import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'

interface DeleteAspectFlags {
  'media-library-id'?: string
  'aspect-name'?: string
}

const deleteAspectAction: CliCommandAction<DeleteAspectFlags> = async (args, context) => {
  const {output, chalk, apiClient, prompt} = context
  const [aspectName] = args.argsWithoutOptions

  if (typeof aspectName === 'undefined') {
    output.error('Specify an aspect name.')
    return
  }

  const mediaLibraryId =
    args.extOptions['media-library-id'] ?? (await determineTargetMediaLibrary(context))

  const confirmedDelete = await prompt.single({
    type: 'confirm',
    message: `Are you absolutely sure you want to undeploy the ${aspectName} aspect from the "${mediaLibraryId}" media library?`,
    default: false,
  })

  if (!confirmedDelete) {
    return
  }

  const client = apiClient().withConfig({apiVersion: MINIMUM_API_VERSION})

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
}

export default deleteAspectAction
