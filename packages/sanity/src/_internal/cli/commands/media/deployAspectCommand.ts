import fs from 'node:fs/promises'
import {EOL} from 'node:os'
import path from 'node:path'

import {type CliCommandDefinition, type SanityClient} from '@sanity/cli'
import {isAssetAspect} from '@sanity/types'
import {register} from 'esbuild-register/dist/node'
import pluralize from 'pluralize-esm'
import {
  catchError,
  filter,
  finalize,
  from,
  groupBy,
  mergeMap,
  type Observable,
  of,
  type OperatorFunction,
  switchMap,
  tap,
  toArray,
  zip,
} from 'rxjs'

import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'
import {withMediaLibraryConfig} from './lib/withMediaLibraryConfig'

const ASPECT_FILE_EXTENSIONS = ['.ts', '.js']

const helpText = `
Options
  --media-library-id The id of the target media library.
  --all              Deploy all aspects.

Examples
  # Deploy the aspect named "someAspect".
  sanity media deploy-aspect someAspect

  # Deploy all aspects.
  sanity media deploy-aspect --all
`

interface DeployAspectFlags {
  'media-library-id'?: string
  'aspect-id'?: string
  'all'?: boolean
}

type Result =
  | {
      status: 'failure'
      reason: 'invalidAspect' | 'failedMutation'
      aspects: unknown[]
      error?: unknown
    }
  | {
      status: 'success'
      aspects: AssetAspectDocument[]
    }

const deployAspectCommand: CliCommandDefinition<DeployAspectFlags> = {
  name: 'deploy-aspect',
  group: 'media',
  signature: '[ASPECT_NAME]',
  description: 'Deploy an aspect.',
  helpText,
  action: async (args, context) => {
    const {output, chalk, apiClient, mediaLibrary} = withMediaLibraryConfig(context)
    const [aspectId] = args.argsWithoutOptions
    const all = args.extOptions.all ?? false

    if (!all && typeof aspectId === 'undefined') {
      output.error(
        'Specify an aspect name, or use the `--all` option to deploy all aspect definitions.',
      )
      return
    }

    if (all && typeof aspectId !== 'undefined') {
      output.error('Specified both an aspect name and `--all`.')
      return
    }

    const mediaLibraryId =
      args.extOptions['media-library-id'] ?? (await determineTargetMediaLibrary(context))

    const client = apiClient().withConfig({
      apiVersion: 'v2025-02-19',
      requestTagPrefix: 'sanity.mediaLibraryCli',
    })

    // losing aspects type narrowing
    importAspects({
      aspectsPath: mediaLibrary.aspectsPath,
      filterAspects: (entry) => {
        if (all) {
          return true
        }

        if (typeof entry === 'object' && entry !== null && '_id' in entry) {
          return entry._id === aspectId
        }

        return false
      },
    })
      .pipe(
        mergeMap<any, Observable<Result>>(([status, aspects]) => {
          if (status === 'invalid') {
            return of<Result>({
              status: 'failure',
              reason: 'invalidAspect',
              aspects,
            })
          }
          return of(aspects).pipe(
            deployAspects({
              client,
              mediaLibraryId,
              dryRun: false,
            }),
          )
        }),
        tap((result) => {
          if (result.aspects.length === 0) {
            if (typeof aspectId !== 'undefined' && result.status === 'success') {
              output.error(`Could not find aspect definition: ${chalk.bold(aspectId)}`)
            }
            return
          }

          const list = result.aspects.map((aspect) => `  - ${aspect._id}`).join(EOL)

          output.print()

          if (result.status === 'success') {
            output.success(
              chalk.bold(
                `Deployed ${result.aspects.length} aspect ${pluralize('definition', result.aspects.length)}`,
              ),
            )
            output.print(list)
          }

          if (result.status === 'failure' && result.reason === 'invalidAspect' && all) {
            output.warn(
              chalk.bold(
                `Skipped deployment of ${result.aspects.length} invalid aspect ${pluralize('definition', result.aspects.length)}`,
              ),
            )
            output.print(list)
          }

          if (result.status === 'failure' && result.reason === 'failedMutation') {
            output.error(
              chalk.bold(
                `Failed to deploy aspect ${pluralize('definition', result.aspects.length)}`,
              ),
            )
            output.print(list)
            output.print()
            output.print(chalk.red(result.error))
          }
        }),
      )
      .subscribe()
  },
}

export default deployAspectCommand

type AssetAspectDocument = any // xxx

function importAspects({
  aspectsPath,
  filterAspects = () => true,
}: {
  aspectsPath: string
  filterAspects?: (aspect: unknown) => boolean
}): Observable<
  [status: 'valid', aspects: AssetAspectDocument[]] | [status: 'invalid', aspect: unknown[]]
> {
  let unregister: (() => void) | undefined

  const entries = fs.readdir(aspectsPath, {
    withFileTypes: true,
  })

  return from(entries).pipe(
    tap({
      subscribe() {
        if (!__DEV__) {
          unregister = register({
            target: `node${process.version.slice(1)}`,
            supported: {'dynamic-import': true},
          }).unregister
        }
      },
    }),
    mergeMap((entry) => from(entry)),
    filter((file) => file.isFile()),
    filter((file) => ASPECT_FILE_EXTENSIONS.includes(path.extname(file.name))),
    switchMap((file) => importAspect({aspectsPath, filename: file.name})),
    groupBy<unknown, 'valid' | 'invalid'>((module) =>
      isAssetAspect(module) ? 'valid' : 'invalid',
    ),
    mergeMap((group) => zip(of(group.key), group.pipe(filter(filterAspects), toArray()))),
    finalize(() => unregister?.()),
  )
}

function importAspect({
  aspectsPath,
  filename,
}: {
  aspectsPath: string
  filename: string
}): Observable<AssetAspectDocument> {
  // eslint-disable-next-line import/no-dynamic-require
  return of(require(path.resolve(aspectsPath, filename)).default)
}

function deployAspects({
  client,
  dryRun,
  mediaLibraryId,
}: {
  client: SanityClient
  dryRun: boolean
  mediaLibraryId: string
}): OperatorFunction<AssetAspectDocument[], Result> {
  return switchMap((aspects) =>
    client.observable
      .request({
        method: 'POST',
        uri: `/media-libraries/${mediaLibraryId}/mutate`,
        tag: 'deploy',
        query: {
          dryRun: String(dryRun),
        },
        body: {
          mutations: aspects.map((aspect) => ({
            createOrReplace: aspect,
          })),
        },
      })
      .pipe(
        mergeMap(() =>
          of({
            status: 'success',
            aspects,
          }),
        ),
        catchError<any, Observable<Result>>((error) =>
          of({
            status: 'failure',
            reason: 'failedMutation',
            error: error.message,
            aspects,
          }),
        ),
      ),
  )
}
