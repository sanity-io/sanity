import {type CliCommandDefinition} from '@sanity/cli'

import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'

const helpText = `
Options
  --media-library-id The id of the target media library.

Examples
  # Import all assets from the "products" directory.
  sanity media import products

  # Import all assets from "gallery.tar.gz".
  sanity media import gallery.tar.gz
`

interface MediaFlags {
  'media-library-id'?: string
}

const importMediaCommand: CliCommandDefinition<MediaFlags> = {
  name: 'import',
  group: 'media',
  signature: '[FILE | FOLDER]',
  description: 'Import a set of assets to the target media library.',
  helpText,
  action: async (args, context) => {
    const {output, chalk} = context
    const [path] = args.argsWithoutOptions
    const mediaLibraryId =
      args.extOptions['media-library-id'] ?? (await determineTargetMediaLibrary(context))

    // const {projectId, datasetName, token, client} = await resolveApiClient(
    //   context,
    //   dataset,
    //   defaultApiVersion,
    // )

    try {
      //   await client.request({
      //     method: 'PUT',
      //     headers: {Authorization: `Bearer ${token}`},
      //     uri: `/projects/${projectId}/datasets/${datasetName}/settings/backups`,
      //     body: {
      //       enabled: false,
      //     },
      //   })
      //   output.print(`${chalk.green(`Disabled daily backups for dataset ${datasetName}\n`)}`)
    } catch (error) {
      // throw error
      // const {message} = parseApiErr(error)
      // output.print(`${chalk.red(`Disabling dataset backup failed: ${message}`)}\n`)
    }
  },
}

export default importMediaCommand
