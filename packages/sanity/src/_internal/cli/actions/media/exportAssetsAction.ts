import path from 'node:path'

import {type CliCommandAction} from '@sanity/cli'
import exportDataset from '@sanity/export'

import {type ProgressEvent} from '../../commands/dataset/exportDatasetCommand'
import {MINIMUM_API_VERSION} from './constants'
import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'

interface ExportAssetsFlags {
  'media-library-id'?: string
}

const DEFAULT_CONCURRENCY = 6

const exportAssetsAction: CliCommandAction<ExportAssetsFlags> = async (args, context) => {
  const {apiClient, output, chalk} = context

  const mediaLibraryId =
    args.extOptions['media-library-id'] ?? (await determineTargetMediaLibrary(context))

  const client = apiClient().withConfig({
    apiVersion: MINIMUM_API_VERSION,
    requestTagPrefix: 'sanity.mediaLibraryCli.export',
  })

  const outputPath = path.join(
    process.cwd(),
    `media-library-${mediaLibraryId}-${Date.now()}.tar.gz`,
  )

  output.print()
  output.print(`Exporting from media library: ${chalk.bold(mediaLibraryId)}`)
  output.print(`Exporting to path: ${chalk.bold(outputPath)}`)
  output.print()

  let currentStep = 'Beginning export…'
  let spinner = output.spinner(currentStep).start()

  try {
    await exportDataset({
      client,
      mediaLibraryId,
      outputPath,
      drafts: false,
      types: ['sanity.asset'],
      assetConcurrency: DEFAULT_CONCURRENCY,
      mode: 'stream',
      onProgress: (progress: ProgressEvent) => {
        if (progress.step !== currentStep) {
          spinner.succeed()
          spinner = output.spinner(progress.step).start()
        } else if (progress.step === currentStep && progress.update) {
          spinner.text = `${progress.step} (${progress.current}/${progress.total})`
        }
        currentStep = progress.step
      },
      // The `assets.json` assets map is not required for Media Library archives, because the
      // import process reads asset files directly from the archive.
      assetsMap: false,
      // The documents listed in `data.ndjson` are only used for recording aspect data. If there
      // is no aspect data, the document can safely be omitted.
      filterDocument: (doc: unknown) => {
        if (typeof doc !== 'object' || doc === null || !('aspects' in doc)) {
          return false
        }
        return (
          typeof doc.aspects === 'object' &&
          doc.aspects !== null &&
          Object.keys(doc.aspects).length !== 0
        )
      },
      // Media Library archives only record asset aspect data. All other data can be safely
      // ommitted.
      transformDocument: (doc: unknown) => {
        if (
          typeof doc !== 'object' ||
          doc === null ||
          !('currentVersion' in doc) ||
          !('aspects' in doc)
        ) {
          return doc
        }

        if (
          typeof doc.currentVersion !== 'object' ||
          doc.currentVersion === null ||
          !('_ref' in doc.currentVersion) ||
          typeof doc.currentVersion._ref !== 'string'
        ) {
          return doc
        }

        // Determine the asset's path inside the archive: either "images" or "files".
        const pathPrefix = [doc.currentVersion._ref.split('-')[0], 's'].join('')

        return {
          filename: [pathPrefix, generateFilename(doc.currentVersion._ref)].join('/'),
          aspects: doc.aspects,
        }
      },
    })
  } catch (error) {
    spinner.fail(`Failed to export media library`)
    throw error
  }

  spinner.succeed(`Exported media library to ${chalk.bold(outputPath)}`)
}

export default exportAssetsAction

function generateFilename(assetId: string): string {
  const [, , asset, ext] = assetId.match(/^(image|file)-(.*?)(-[a-z]+)?$/) || []
  const extension = (ext || 'bin').replace(/^-/, '')
  return asset ? `${asset}.${extension}` : `${assetId}.bin`
}
