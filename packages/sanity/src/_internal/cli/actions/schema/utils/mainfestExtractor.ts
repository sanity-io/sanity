import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliOutputter,
  type TelemetryUserProperties,
} from '@sanity/cli'
import {type TelemetryLogger} from '@sanity/telemetry'
import chalk from 'chalk'

import {type ExtractManifestFlags, extractManifestSafe} from '../../manifest/extractManifestAction'
import {GenerateManifest} from '../__telemetry__/schemaStore.telemetry'
import {FlagValidationError} from './schemaStoreValidation'

export type ManifestExtractor = (manifestDir: string) => Promise<void>

export async function ensureManifestExtractSatisfied(args: {
  schemaRequired: boolean
  extractManifest: boolean
  manifestDir: string
  manifestExtractor: (manifestDir: string) => Promise<void>
  output: CliOutputter
  telemetry: TelemetryLogger<TelemetryUserProperties>
}) {
  const {schemaRequired, extractManifest, manifestDir, manifestExtractor, output, telemetry} = args
  if (!extractManifest) {
    return true
  }
  const trace = telemetry.trace(GenerateManifest, {manifestDir, schemaRequired})
  try {
    trace.start()
    // a successful manifest extract will write a new manifest file, which manifestReader will then read from disk
    await manifestExtractor(manifestDir)
    trace.complete()
    return true
  } catch (err) {
    trace.error(err)

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
