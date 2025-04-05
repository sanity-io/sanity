import fs from 'node:fs/promises'
import path from 'node:path'

import {type CliCommandDefinition} from '@sanity/cli'
import {camelCase, deburr} from 'lodash'

import {withMediaLibraryConfig} from './lib/withMediaLibraryConfig'

const helpText = `
Examples
  # Create a new aspect definition file.
  sanity media create-aspect
`

const createAspectCommand: CliCommandDefinition = {
  name: 'create-aspect',
  group: 'media',
  signature: '',
  description: 'Create a new aspect definition file.',
  helpText,
  action: async (_args, context) => {
    const {output, chalk, prompt, mediaLibrary} = withMediaLibraryConfig(context)

    const title = await prompt.single({
      message: 'Title',
      type: 'input',
    })

    const name = await prompt.single({
      message: 'Name',
      type: 'input',
      default: deburr(camelCase(title)),
    })

    const safeName = deburr(camelCase(name))
    const destinationPath = path.resolve(mediaLibrary.aspectsPath, `${safeName}.ts`)
    const relativeDestinationPath = path.relative(process.cwd(), destinationPath)

    await fs.mkdir(path.resolve(mediaLibrary.aspectsPath), {
      recursive: true,
    })

    const destinationPathExists = await fs
      .stat(destinationPath)
      .then(() => true)
      .catch(() => false)

    if (destinationPathExists) {
      output.error(`A file already exists at ${chalk.bold(relativeDestinationPath)}`)
      return
    }

    await fs.writeFile(
      destinationPath,
      template({
        name: deburr(camelCase(name)),
        title,
      }),
    )

    output.success(`Aspect created! ${chalk.bold(relativeDestinationPath)}`)
    output.print()
    output.print('Next steps:')
    output.print(
      `Open ${chalk.bold(relativeDestinationPath)} in your code editor and customize the aspect.`,
    )
    output.print()
    output.print('Deploy this aspect by running:')
    output.print(chalk.bold(`sanity media deploy-aspect ${safeName}`))
    output.print()
    output.print('Deploy all aspects by running:')
    output.print(chalk.bold(`sanity media deploy-aspect --all`))
  },
}

export default createAspectCommand

function template({name, title}: {name: string; title: string}) {
  return `import {defineAssetAspect, defineField} from 'sanity'

export default defineAssetAspect({
  name: '${name}',
  title: '${title}',
  type: 'object',
  fields: [
    defineField({
      name: 'string',
      title: 'Plain String',
      type: 'string',
    }),
  ],
})
`
}
