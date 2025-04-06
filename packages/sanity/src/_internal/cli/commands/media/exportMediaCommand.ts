import {type CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  --media-library-id The id of the target media library.

Examples
  # Export all assets and aspects.
  sanity media export
`

interface MediaFlags {
  'media-library-id'?: string
}

const exportMediaCommand: CliCommandDefinition<MediaFlags> = {
  name: 'export',
  group: 'media',
  signature: '[FILE]',
  description: 'Export all assets and aspects from the target media library as a tarball.',
  helpText,
  action: async (args, context) => {
    const {output, chalk} = context
    const [path] = args.argsWithoutOptions
    const mediaLibraryId = args.extOptions['media-library-id']
    // eslint-disable-next-line
    console.log('HEY: export')
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

export default exportMediaCommand
