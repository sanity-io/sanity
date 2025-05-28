import {createHash} from 'node:crypto'
import {createReadStream, type ReadStream} from 'node:fs'
import fs, {mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {text} from 'node:stream/consumers'
import {pipeline} from 'node:stream/promises'

import {
  type CliCommandAction,
  type CliCommandContext,
  type CliOutputter,
  type SanityClient,
} from '@sanity/cli'
import {type FileAsset, type ImageAsset, type SanityDocument} from '@sanity/types'
import {type Chalk} from 'chalk'
import gunzipMaybe from 'gunzip-maybe'
import isTar from 'is-tar'
// @ts-expect-error `peek-stream` module currently untyped
import peek from 'peek-stream'
import {
  catchError,
  EMPTY,
  filter,
  from,
  map,
  mergeMap,
  mergeWith,
  type Observable,
  of,
  type OperatorFunction,
  pipe,
  scan,
  switchMap,
  tap,
  zip,
} from 'rxjs'
import tar from 'tar-fs'
import {glob} from 'tinyglobby'

import {debug as baseDebug} from '../../debug'
import {MINIMUM_API_VERSION} from './constants'
import {determineTargetMediaLibrary} from './lib/determineTargetMediaLibrary'
import {findNdjsonEntry} from './lib/findNdjsonEntry'

interface ImportAssetsFlags {
  'media-library-id'?: string
  'replace-aspects'?: boolean
}

const debug = baseDebug.extend('importMedia')

const DEFAULT_CONCURRENCY = 6

interface MediaLibraryUploadResult {
  asset: SanityDocument & {
    _type: 'sanity.asset'
    assetType: ImageAsset['_type'] | FileAsset['_type']
    aspects: unknown
  }
  assetInstance: ImageAsset | FileAsset
}

interface MediaLibraryUploadResponse {
  type: 'response'
  body: MediaLibraryUploadResult
}

interface ResolvedAsset {
  /**
   * The ids of the `sanity.asset` documents that currently refer to the asset.
   *
   * These documents contain aspects, and reference an asset instance document.
   */
  assetIds: string[]
  /**
   * The original filename of the asset as it appears in the import source.
   *
   * Note: Currently includes `images/` or `files/` prefix.
   */
  originalFilename: string
  sha1Hash: string
  isExistingAsset: boolean
}

/**
 * @internal
 */
export type AssetWithAspects<Asset extends ResolvedAsset = ResolvedAsset> = Asset & {
  aspects: unknown | undefined
}

interface State {
  /**
   * The count of input files.
   */
  fileCount: number
  /**
   * The last asset processed.
   */
  asset: AssetWithAspects
}

interface Options {
  sourcePath: string
  client: SanityClient
  replaceAspects: boolean
  chalk: Chalk
  spinner: ReturnType<CliCommandContext['output']['spinner']>
  output: CliOutputter
}

interface Context extends Options {
  workingPath: string
  ndjson: () => ReadStream
}

// TODO: Order assets lexicographically before processing, allow resumable import
// TODO: Granularly report upload progress of each asset (especially useful for large assets).
const importAssetsAction: CliCommandAction<ImportAssetsFlags> = async (args, context) => {
  const {output, apiClient, chalk} = context
  const [importSourcePath] = args.argsWithoutOptions
  const replaceAspects = args.extOptions['replace-aspects'] ?? false

  const mediaLibraryId =
    args.extOptions['media-library-id'] ?? (await determineTargetMediaLibrary(context))

  const client = apiClient().withConfig({
    'apiVersion': MINIMUM_API_VERSION,
    'requestTagPrefix': 'sanity.mediaLibraryCli.import',
    '~experimental_resource': {
      type: 'media-library',
      id: mediaLibraryId,
    },
    'perspective': 'drafts',
  })

  output.print()
  output.print(`Importing to media library: ${chalk.bold(mediaLibraryId)}`)
  output.print(`Importing from path: ${chalk.bold(importSourcePath)}`)
  output.print()

  const spinner = output.spinner('Beginning import…').start()

  importer({
    client,
    sourcePath: importSourcePath,
    replaceAspects,
    chalk,
    spinner,
    output,
  })
    .pipe(
      reportResult({
        chalk,
        spinner,
      }),
    )
    .subscribe({
      error: (error) => {
        spinner.stop()
        output.error(error)
      },
    })
}

export default importAssetsAction

export function importer(options: Options): Observable<State> {
  return resolveSource(options).pipe(
    mergeMap(({files, images, aspectsNdjsonPath, workingPath}) => {
      const fileCount = files.length + images.length

      if (fileCount === 0) {
        throw new Error('No assets to import')
      }

      const context: Context = {
        ...options,
        workingPath,
        ndjson: () => createReadStream(aspectsNdjsonPath),
      }

      return from(files).pipe(
        switchMap((file) => zip(of<'file'>('file'), of(file))),
        mergeWith(from(images).pipe(switchMap((file) => zip(of<'image'>('image'), of(file))))),
        fetchExistingAssets(context),
        uploadAsset(context),
        resolveAspectData(context),
        setAspects(context),
        map((asset) => ({
          asset,
          fileCount,
        })),
      )
    }),
  )
}

/**
 * @internal
 */
export function resolveSource({
  sourcePath,
  chalk,
}: Pick<Context, 'sourcePath' | 'chalk'>): Observable<{
  files: string[]
  images: string[]
  aspectsNdjsonPath: string
  workingPath: string
}> {
  return from(fs.stat(sourcePath)).pipe(
    switchMap((stats) => {
      return stats.isDirectory()
        ? of(sourcePath)
        : from(mkdtemp(path.join(tmpdir(), 'sanity-media-library-import'))).pipe(
            switchMap((tempPath) => {
              return from(
                pipeline(createReadStream(sourcePath), gunzipMaybe(), untarMaybe(tempPath)),
              ).pipe(map(() => tempPath))
            }),
          )
    }),
    switchMap((importSourcePath) => {
      return from(
        glob(['**/data.ndjson'], {
          cwd: importSourcePath,
          deep: 2,
          absolute: true,
        }),
      ).pipe(
        map(([aspectsNdjsonPath]) => ({
          aspectsNdjsonPath,
          importSourcePath,
          workingPath:
            typeof aspectsNdjsonPath === 'undefined'
              ? importSourcePath
              : path.dirname(aspectsNdjsonPath),
        })),
      )
    }),
    tap(({aspectsNdjsonPath, importSourcePath}) => {
      if (typeof aspectsNdjsonPath === 'undefined') {
        throw new Error(
          `No ${chalk.bold('data.ndjson')} file found in import source ${chalk.bold(importSourcePath)}`,
        )
      }
      debug(`[Found NDJSON file] ${aspectsNdjsonPath}`)
    }),
    switchMap(({aspectsNdjsonPath, workingPath}) => {
      return from(
        Promise.all([
          glob(['files/*'], {
            cwd: workingPath,
          }),
          glob(['images/*'], {
            cwd: workingPath,
          }),
        ]),
      ).pipe(
        map(([files, images]) => ({
          files,
          images,
          aspectsNdjsonPath,
          workingPath,
        })),
      )
    }),
  )
}

/**
 * Untar the stream if its contents appear to be tarred.
 *
 * @internal
 */
function untarMaybe(outputPath: string) {
  // @ts-expect-error `peek-stream` module currently untyped
  return peek({newline: false, maxBuffer: 300}, (data, swap) => {
    if (isTar(data)) {
      return swap(null, tar.extract(outputPath))
    }

    return swap(null)
  })
}

/**
 * Fetch the ids of all asset documents that reference the input asset.
 * The input asset is identified by its SHA-1 hash.
 *
 * @internal
 */
function fetchAssetsByHash({
  client,
  type,
}: {
  client: SanityClient
  type: 'image' | 'file'
}): OperatorFunction<string, [hash: string, assetIds: string[]]> {
  return switchMap((hash) =>
    client.observable
      .fetch<string[]>(
        `*[
          _type == "sanity.asset" &&
          currentVersion._ref == *[
            _type == $type &&
            sha1hash == $hash
          ][0]._id
        ]._id`,
        {
          type: ['sanity', `${type}Asset`].join('.'),
          hash,
        },
        {
          tag: 'asset.getId',
        },
      )
      .pipe(switchMap((assetIds) => zip(of(hash), of(assetIds)))),
  )
}

function fetchExistingAssets({
  client,
  workingPath,
}: Context): OperatorFunction<
  [type: 'image' | 'file', asset: string],
  ResolvedAsset | [type: 'image' | 'file', asset: string, hash: string]
> {
  return mergeMap(([type, asset]) => {
    const createSha1Hash = createHash('sha1')

    const sha1hash = text(
      createReadStream(path.join(workingPath, asset)).pipe(createSha1Hash).setEncoding('hex'),
    )

    return from(sha1hash).pipe(
      tap((hash) => debug(`[Asset ${asset}] Checking for ${type} asset with hash ${hash}`)),
      fetchAssetsByHash({client, type}),
      map<
        [string, string[]],
        ResolvedAsset | [type: 'image' | 'file', asset: string, hash: string]
      >(([hash, assetIds]) => {
        if (assetIds.length === 0) {
          return [type, asset, hash]
        }

        return {
          originalFilename: asset,
          sha1Hash: hash,
          assetIds,
          isExistingAsset: true,
        }
      }),
    )
  })
}

/**
 * Find the first matching entry in the provided NDJSON stream and attach it to the asset object.
 *
 * @internal
 */
function resolveAspectData({ndjson}: Context): OperatorFunction<ResolvedAsset, AssetWithAspects> {
  return mergeMap((resolvedAsset) =>
    from(
      findNdjsonEntry<{aspects: unknown}>(
        ndjson(),
        (line) =>
          typeof line === 'object' &&
          line !== null &&
          'filename' in line &&
          line.filename === resolvedAsset.originalFilename,
      ),
    ).pipe(
      map((aspectsFromImport) => ({
        ...resolvedAsset,
        aspects: aspectsFromImport?.aspects,
      })),
    ),
  )
}

// TODO: Batch mutations to reduce HTTP request count.
export function setAspects({
  client,
  replaceAspects,
}: Pick<Context, 'client' | 'replaceAspects'>): OperatorFunction<
  AssetWithAspects,
  AssetWithAspects
> {
  return mergeMap((asset) => {
    const {assetIds, isExistingAsset, aspects} = asset

    if (isExistingAsset && !replaceAspects) {
      debug(`[Asset ${asset.originalFilename}] Skipping replacement of existing aspects`)
      return of(asset)
    }

    if (typeof aspects === 'undefined') {
      debug(`[Asset ${asset.originalFilename}] No aspects to import`)
      return of(asset)
    }

    const transaction = assetIds.reduce(
      (previous, assetId) => previous.patch(assetId, {set: {aspects}}),
      client.observable.transaction(),
    )

    debug(
      `[Asset ${asset.originalFilename}] Setting aspects on asset documents ${JSON.stringify(assetIds)}`,
    )

    return transaction
      .commit({
        visibility: 'async',
        tag: 'asset.setAspects',
      })
      .pipe(map(() => asset))
  }, DEFAULT_CONCURRENCY)
}

function uploadAsset({
  workingPath,
  client,
}: Context): OperatorFunction<
  ResolvedAsset | [type: 'image' | 'file', asset: string, hash: string],
  ResolvedAsset
> {
  return mergeMap((maybeResolvedAsset) => {
    if ('assetIds' in maybeResolvedAsset) {
      debug(
        `[Asset ${maybeResolvedAsset.originalFilename}] Skipping upload of existing asset with hash ${maybeResolvedAsset.sha1Hash}`,
      )
      return of(maybeResolvedAsset)
    }

    const [type, asset, hash] = maybeResolvedAsset
    debug(`[Asset ${asset}] Uploading new asset`)

    return client.observable.assets
      .upload(type, createReadStream(path.join(workingPath, asset)), {
        tag: 'asset.upload',
      })
      .pipe(
        catchError((error) => {
          // An asset matching the hash was not found during previous steps, but appears to exist upon upload.
          //
          // This may occur if:
          //   - The asset was uploaded by another client since the check was performed.
          //   - The asset instance document exists, but is not referenced by any asset document.
          if (error.statusCode === 409) {
            debug(`[Asset ${asset}] Cannot overwrite existing ${type} asset with hash ${hash}`)
            return EMPTY
          }
          return EMPTY
        }),
        filter((response) => response.type === 'response'),
        tap(() => debug(`[Asset ${asset}] Finished uploading new asset`)),
        // TODO: The `client.assets.upload` method should return `MediaLibraryUploadResponse` when operating on Media Library resources. When that occurs, this type assertion can be removed.
        map((response) => (response as unknown as MediaLibraryUploadResponse).body),
        map<MediaLibraryUploadResult, ResolvedAsset>((result) => ({
          assetIds: [result.asset._id],
          originalFilename: asset,
          sha1Hash: hash,
          isExistingAsset: false,
        })),
      )
  }, DEFAULT_CONCURRENCY)
}

function reportResult({
  chalk,
  spinner,
}: Pick<Context, 'chalk' | 'spinner'>): OperatorFunction<State, [number, State | undefined]> {
  let previousState: State | undefined = undefined

  return pipe(
    scan<State, [number, State | undefined]>(
      (processedAssetsCount, state) => [processedAssetsCount[0] + 1, state],
      [0, undefined],
    ),
    tap({
      next: ([processedAssetsCount, state]) => {
        previousState = state
        spinner.text = `${processedAssetsCount} of ${state?.fileCount} assets imported ${chalk.dim(state?.asset.originalFilename)}`
      },
      complete: () => spinner.succeed(`Imported ${previousState?.fileCount} assets`),
    }),
  )
}
