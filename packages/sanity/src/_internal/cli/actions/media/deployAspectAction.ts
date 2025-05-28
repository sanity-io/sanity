import fs from 'node:fs/promises'
import {EOL} from 'node:os'
import path from 'node:path'

import {type CliCommandAction, type CliCommandContext, type SanityClient} from '@sanity/cli'
import {validateMediaLibraryAssetAspect} from '@sanity/schema/_internal'
import {
  isAssetAspect,
  type MediaLibraryAssetAspectDocument,
  type MultipleMutationResult,
  type SchemaValidationProblem,
} from '@sanity/types'
import {type Chalk} from 'chalk'
import {register} from 'esbuild-register/dist/node'
import pluralize from 'pluralize-esm'
import {
  catchError,
  filter,
  finalize,
  from,
  groupBy,
  map,
  mergeMap,
  type MonoTypeOperatorFunction,
  type Observable,
  of,
  type OperatorFunction,
  pipe,
  scan,
  switchMap,
  takeLast,
  tap,
  toArray,
  zip,
} from 'rxjs'

import {ASPECT_FILE_EXTENSIONS, MINIMUM_API_VERSION} from './constants'
import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'
import {withMediaLibraryConfig} from './lib/withMediaLibraryConfig'

interface DeployAspectFlags {
  'media-library-id'?: string
  'aspect-id'?: string
  'all'?: boolean
}

type Result =
  | {
      status: 'failure'
      reason: 'invalidAspect' | 'failedMutation'
      aspects: AspectContainer[]
      error?: unknown
    }
  | {
      status: 'success'
      aspects: AspectContainer[]
    }

type Status = 'valid' | 'invalid'

type AspectsPair = [status: Status, aspects: AspectContainer[]]

type AspectContainer = {
  filename: string
  validationErrors: SchemaValidationProblem[][]
} & (
  | {
      status: Extract<Status, 'valid'>
      aspect: MediaLibraryAssetAspectDocument
    }
  | {
      status: Extract<Status, 'invalid'>
      aspect: unknown
    }
)

const deployAspectAction: CliCommandAction<DeployAspectFlags> = async (args, context) => {
  const {output, apiClient, mediaLibrary} = withMediaLibraryConfig(context)
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
    apiVersion: MINIMUM_API_VERSION,
    requestTagPrefix: 'sanity.mediaLibraryCli',
  })

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
      mergeMap<AspectsPair, Observable<Result>>(([status, aspects]) => {
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
      reportResult({context}),
      reportUnfoundAspect({aspectId, context}),
    )
    .subscribe()
}

export default deployAspectAction

function importAspects({
  aspectsPath,
  filterAspects = () => true,
}: {
  aspectsPath: string
  filterAspects?: (aspect: unknown) => boolean
}): Observable<AspectsPair> {
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
    map(([filename, maybeAspect]) => {
      if (!isAssetAspect(maybeAspect)) {
        return {
          status: 'invalid' as const,
          aspect: maybeAspect,
          validationErrors: [],
          filename,
        }
      }

      const [valid, errors] = validateMediaLibraryAssetAspect(maybeAspect.definition)

      if (!valid) {
        return {
          status: 'invalid' as const,
          aspect: maybeAspect,
          validationErrors: errors,
          filename,
        }
      }

      return {
        status: 'valid' as const,
        aspect: maybeAspect,
        validationErrors: [],
        filename,
      }
    }),
    groupBy<AspectContainer, 'valid' | 'invalid'>((maybeAspect) => maybeAspect.status),
    mergeMap(
      (group) =>
        zip(
          of(group.key),
          group.pipe(
            filter(({aspect}) => filterAspects(aspect)),
            toArray(),
          ),
        ) as Observable<AspectsPair>,
    ),
    finalize(() => unregister?.()),
  )
}

function importAspect({
  aspectsPath,
  filename,
}: {
  aspectsPath: string
  filename: string
}): Observable<[filename: string, aspect: MediaLibraryAssetAspectDocument]> {
  // eslint-disable-next-line import/no-dynamic-require
  return of([filename, require(path.resolve(aspectsPath, filename)).default])
}

function deployAspects({
  client,
  dryRun,
  mediaLibraryId,
}: {
  client: SanityClient
  dryRun: boolean
  mediaLibraryId: string
}): OperatorFunction<AspectContainer[], Result> {
  return pipe(
    filter((aspects) => aspects.length !== 0),
    switchMap((aspects) => {
      return client.observable
        .request<MultipleMutationResult>({
          method: 'POST',
          uri: `/media-libraries/${mediaLibraryId}/mutate`,
          tag: 'deployAspects',
          query: {
            dryRun: String(dryRun),
          },
          body: {
            mutations: aspects.map(({aspect}) => ({
              createOrReplace: aspect,
            })),
          },
        })
        .pipe(
          mergeMap(() =>
            of<Result>({
              status: 'success',
              aspects,
            }),
          ),
          catchError((error) =>
            of<Result>({
              status: 'failure',
              reason: 'failedMutation',
              error: error.message,
              aspects,
            }),
          ),
        )
    }),
  )
}

function reportResult({context}: {context: CliCommandContext}): MonoTypeOperatorFunction<Result> {
  return tap((result) => {
    const {output, chalk} = context

    const list = formatAspectList({
      aspects: result.aspects,
      chalk,
    })

    if (result.status === 'success' && result.aspects.length !== 0) {
      output.print()
      output.success(
        chalk.bold(
          `Deployed ${result.aspects.length} ${pluralize('aspect', result.aspects.length)}`,
        ),
      )
      output.print(list)
    }

    if (
      result.status === 'failure' &&
      result.aspects.length !== 0 &&
      result.reason === 'invalidAspect'
    ) {
      output.print()
      output.warn(
        chalk.bold(
          `Skipped ${result.aspects.length} invalid ${pluralize('aspect', result.aspects.length)}`,
        ),
      )
      output.print(list)
    }

    if (
      result.status === 'failure' &&
      result.aspects.length !== 0 &&
      result.reason === 'failedMutation'
    ) {
      output.print()
      output.error(
        chalk.bold(
          `Failed to deploy ${result.aspects.length} ${pluralize('aspect', result.aspects.length)}`,
        ),
      )
      output.print(list)
      output.print()
      output.print(chalk.red(result.error))
    }
  })
}

function reportUnfoundAspect({
  aspectId,
  context,
}: {
  context: CliCommandContext
  aspectId?: string
}): OperatorFunction<Result, AspectContainer[]> {
  const {output, chalk} = context

  return pipe(
    scan<Result, AspectContainer[]>((aspects, result) => aspects.concat(result.aspects), []),
    takeLast(1),
    tap((aspects) => {
      const aspectNotFound = aspects.length === 0 && aspectId
      if (aspectNotFound) {
        output.print()
        output.error(`Could not find aspect: ${chalk.bold(aspectId)}`)
      }
    }),
  )
}

function formatAspectList({aspects, chalk}: {aspects: AspectContainer[]; chalk: Chalk}): string {
  return aspects
    .map(({aspect, filename, validationErrors}) => {
      const label =
        typeof aspect === 'object' &&
        aspect !== null &&
        '_id' in aspect &&
        typeof aspect._id !== 'undefined'
          ? aspect._id
          : 'Unnamed aspect'

      const simplifiedErrors = validationErrors.flatMap((group) =>
        group.map(({message}) => message),
      )

      const errorLabel = simplifiedErrors.length === 0 ? '' : ` ${chalk.bgRed(simplifiedErrors[0])}`

      const remainingErrorsCount = simplifiedErrors.length - 1

      const remainingErrorsLabel =
        remainingErrorsCount > 0
          ? chalk.italic(
              ` and ${simplifiedErrors.length - 1} other ${pluralize('error', remainingErrorsCount)}`,
            )
          : ''

      return `  - ${label} ${chalk.dim(filename)}${errorLabel}${remainingErrorsLabel}`
    })
    .join(EOL)
}
