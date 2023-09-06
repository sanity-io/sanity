import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {TypegenCommandFlags} from '../../actions/typegen/typegenAction'

const helpText = `
Options
  --workspace Choose which workspace to extract the schema typings from (defaults to 'default')

Examples
  # Generate TypeScript definitions from the default workspace
  sanity typegen ./sanity.schema.typegen-d.ts

  # Use a schema defined in a different workspace
  sanity typegen --workspace staging ./staging.schema.typegen-d.ts
`

const typegenCommand: CliCommandDefinition = {
  name: 'typegen',
  signature: '[--workspace <workspace-name>] [OUTPUT_FILE]',
  description: 'Generate TypeScript definitions from the current Sanity schema',
  action: async (args: CliCommandArguments<TypegenCommandFlags>, context: CliCommandContext) => {
    const mod = await import('../../actions/typegen/typegenAction')

    return mod.default(args, context)
    // const typegenAction = await getTypegenAction()

    // return typegenAction(args, context)
  },
  helpText,
}

// export async function getTypegenAction(): Promise<
//   (args: CliCommandArguments<TypegenCommandFlags>, context: CliCommandContext) => Promise<void>
// > {
//   // NOTE: in dev-mode we want to include from `src` so we need to use `.ts` extension
//   // NOTE: this `if` statement is not included in the output bundle
//   if (__DEV__) {
//     // eslint-disable-next-line import/extensions
//     const mod: typeof import('../../actions/typegen/typegenAction') = require('../../actions/typegen/typegenAction.ts')

//     return mod.default
//   }

//   const mod = await import('../../actions/typegen/typegenAction')

//   return mod.default
// }

export default typegenCommand
