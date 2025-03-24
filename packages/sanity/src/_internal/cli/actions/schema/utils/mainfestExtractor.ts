import {type CliCommandArguments, type CliCommandContext, type CliOutputter} from '@sanity/cli'
import chalk from 'chalk'

import {type ExtractManifestFlags, extractManifestSafe} from '../../manifest/extractManifestAction'
import {FlagValidationError} from './schemaStoreValidation'

export type ManifestExtractor = (manifestDir: string) => Promise<void>

export async function ensureManifestExtractSatisfied(args: {
  schemaRequired: boolean
  extractManifest: boolean
  manifestDir: string
  manifestExtractor: (manifestDir: string) => Promise<void>
  output: CliOutputter
}) {
  const {schemaRequired, extractManifest, manifestDir, manifestExtractor, output} = args
  if (!extractManifest) {
    return true
  }
  try {
    // a successful manifest extract will write a new manifest file, which manifestReader will then read from disk
    await manifestExtractor(manifestDir)
    return true
  } catch (err) {
    if (schemaRequired || err instanceof FlagValidationError) {
      throw err
    } else {
      output.print(chalk.gray(`↳ Failed to extract manifest:\n  ${err.message}`))
      return false
    }
  }
}

export function createManifestExtractor(context: CliCommandContext & {safe?: boolean}) {
  return async (manifestDir: string) => {
    const error = await extractManifestSafe(
      {
        extOptions: {path: manifestDir},
        groupOrCommand: 'extract',
        argv: [],
        argsWithoutOptions: [],
        extraArguments: [],
      } as CliCommandArguments<ExtractManifestFlags>,
      context,
    )
    if (!context.safe && error) {
      throw error
    }
  }
}
