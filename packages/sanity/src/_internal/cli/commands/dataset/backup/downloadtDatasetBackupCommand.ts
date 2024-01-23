import {debug} from 'console'
import {PathLike, createWriteStream, existsSync, mkdirSync} from 'fs'
import {tmpdir} from 'os'
import path from 'path'
import type {CliCommandDefinition, SanityClient} from '@sanity/cli'
import {QueryParams} from '@sanity/client'
import {absolutify} from '@sanity/util/fs'
import pMap from 'p-map'
import prettyMs from 'pretty-ms'
import rimraf from 'rimraf'
import chooseBackupIdPrompt from '../../../actions/dataset/backup/chooseBackupIdPrompt'
import resolveApiClient from '../../../actions/dataset/backup/resolveApiClient'
import getOutputPath from '../../../actions/dataset/getOutoutPath'
import {defaultApiVersion} from './datasetBackupGroup'

const archiver = require('archiver')
const {getIt} = require('get-it')
const {keepAlive, promise} = require('get-it/middleware')

const CONNECTION_TIMEOUT = 15 * 1000 // 15 seconds
const READ_TIMEOUT = 3 * 60 * 1000 // 3 minutes
const MAX_RETRIES = 5
const DEFAULT_DOWNLOAD_CONCURRENCY = 10

const request = getIt([keepAlive(), promise({onlyBody: true})])
const socketsWithTimeout = new WeakSet()
const exponentialBackoff = (retryCount: number) => Math.pow(2, retryCount) * 200

type file = {
  name: string
  url: string
}

type DownloadBackupOptions = {
  backupId: string
  outDir: string
  overwrite?: boolean
  concurrency?: number
}

type GetBackupResponse = {
  createdAt: string
  totalSize: number
  files: file[]
  nextCursor?: string
}

interface ProgressEvent {
  step: string
  update?: boolean
  current: number
  total: number
}

const helpText = `
Options
  --backup-id <string> The backup ID to download (required)
  --out <string>       The file path the backup should download to
  --overwrite          Allows overwriting of existing backup file.
  --concurrency <num>  Concurrent number of backup item downloads (max: 24)
  --no-compress        Skips compressing tarball entries (still generates a gzip file)

Examples
  sanity dataset-backup download <dataset-name> --backup-id 2020-01-01-backup-abcd1234
  sanity dataset-backup download <dataset-name> --backup-id 2020-01-01-backup-abcd1234 --out /path/to/file
  sanity dataset-backup download <dataset-name> --backup-id 2020-01-01-backup-abcd1234 --out /path/to/file --overwrite
`

const downloadDatasetBackupCommand: CliCommandDefinition = {
  name: 'download',
  group: 'dataset-backup',
  signature: '[DATASET_NAME]',
  description: 'Download a dataset backup to a local file.',
  helpText,
  action: async (args, context) => {
    const {output, prompt, workDir, chalk} = context
    const flags = args.extOptions
    const [dataset] = args.argsWithoutOptions

    const {projectId, datasetName, client} = await resolveApiClient(
      context,
      dataset,
      defaultApiVersion,
    )

    const backupId = flags['backup-id'] || (await chooseBackupIdPrompt(context, datasetName))

    output.print('╭───────────────────────────────────────────────────────────╮')
    output.print('│                                                           │')
    output.print('│ Downloading backup for:                                   │')
    output.print(`│ ${chalk.bold('projectId')}: ${chalk.cyan(projectId).padEnd(56)} │`)
    output.print(`│ ${chalk.bold('dataset')}: ${chalk.cyan(datasetName).padEnd(58)} │`)
    output.print(`│ ${chalk.bold('backupId')}: ${chalk.cyan(backupId).padEnd(56)} │`)
    output.print('│                                                           │')
    output.print('╰───────────────────────────────────────────────────────────╯')
    output.print('')

    const defaultBackupFileName = `${datasetName}-backup-${backupId}.tar.gz`
    let destinationPath = flags.out
    if (!destinationPath) {
      destinationPath = await prompt.single({
        type: 'input',
        message: 'Output path:',
        default: path.join(workDir, defaultBackupFileName),
        filter: absolutify,
      })
    }

    const outputPath = await getOutputPath(
      prompt,
      datasetName,
      destinationPath as string,
      flags.overwrite as boolean,
      defaultBackupFileName,
    )

    if (!outputPath) {
      output.print('Cancelled')
      return
    }

    output.print(`Downloading backup to "${chalk.cyan(outputPath)}"`)

    let currentStep = 'Downloading documents and assets...'
    let spinner = output.spinner(currentStep).start()
    const onProgress = (progress: ProgressEvent) => {
      if (progress.step !== currentStep) {
        spinner.succeed()
        spinner = output.spinner(progress.step).start()
      } else if (progress.step === currentStep && progress.update) {
        spinner.text = `${progress.step} (${progress.current}/${progress.total})`
      }

      currentStep = progress.step
    }
    const start = Date.now()

    // Create temporary directory to store files before bundling them into the archive at outputPath.
    const tmpDir = tmpdir()
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir)
    }

    try {
      await downloadFiles(client, datasetName, onProgress, {
        backupId: backupId.toString(),
        outDir: tmpDir,
      })
    } catch (err) {
      spinner.fail()
      throw err
    }

    onProgress({
      step: `Archiving files into a tarball...`,
      update: true,
      current: 1,
      total: 1,
    })

    const archive = archiver('tar', {gzip: true})
    archive.on('error', (err: Error) => {
      throw err
    })

    const archiveDestination = createWriteStream(outputPath as PathLike)
    archiveDestination.on('error', (err: Error) => {
      throw err
    })

    archiveDestination.on('close', () => {
      output.print(`Cleaning up temporary files at ${chalk.cyan(`${tmpDir}`)}`)
      rimraf(tmpDir, (err) => {
        if (err) {
          debug(`Error cleaning up temporary files: ${err.message}`)
        }
      })
    })

    archive.pipe(archiveDestination)

    // We intentionally download all files first, then bundle them into the archive. This lets us
    // download multiple files concurrently. A possible optimisation is to stream files into the
    // archive as soon as they've downloaded.
    archive.directory(tmpDir, false)
    archive.finalize()

    onProgress({
      step: `Backup download complete (${prettyMs(Date.now() - start)}).`,
      update: true,
      current: 1,
      total: 1,
    })
    spinner.succeed()
  },
}

async function downloadFiles(
  client: SanityClient,
  datasetName: string,
  onProgress: (progress: ProgressEvent) => void,
  opts: DownloadBackupOptions,
) {
  // Print information about what projectId and dataset it is being exported from
  const {projectId, token} = client.config()

  let totalItemsDownloaded = 0
  let cursor: string | null = ''
  while (cursor !== null) {
    const query: QueryParams = cursor === '' ? {} : {nextCursor: cursor}
    let response: GetBackupResponse = {
      createdAt: '',
      totalSize: 0,
      files: [],
    }

    try {
      response = await client.request({
        headers: {Authorization: `Bearer ${token}`},
        uri: `/projects/${projectId}/datasets/${datasetName}/backups/${opts.backupId}`,
        query,
      })

      if (response) {
        const {nextCursor, files} = response
        if (!files || files.length === 0) {
          throw new Error('No files to download')
        }

        const mapper = async (f: file) => {
          await downloadFile(f, opts.outDir)
        }

        await pMap(files, mapper, {concurrency: opts.concurrency || DEFAULT_DOWNLOAD_CONCURRENCY})
        totalItemsDownloaded += files.length
        // eslint-disable-next-line no-warning-comments
        // TODO: total should be the total number of files to download, but the API doesn't return it atm.
        onProgress({
          step: `Downloading documents and assets...`,
          update: true,
          current: totalItemsDownloaded,
          total: 2,
        })

        cursor = nextCursor || null

        // Sleep for 1s to simulate a delay between requests. This should be removed before release.
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      const msg = error.statusCode ? error.response.body.message : error.message
      throw new Error(`Downloading dataset backup failed: ${msg}`)
    }
  }
}

async function downloadFile(file: file, dir: string) {
  let error
  const filepath = path.join(dir, file.name)
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    try {
      const response = await request({
        url: file.url,
        stream: true,
        maxRedirects: 5,
        timeout: {connect: CONNECTION_TIMEOUT, socket: READ_TIMEOUT},
      })

      if (
        response.connection &&
        typeof response.connection.setTimeout === 'function' &&
        !socketsWithTimeout.has(response.connection)
      ) {
        socketsWithTimeout.add(response.connection)
        response.connection.setTimeout(READ_TIMEOUT, () => {
          response.destroy(
            new Error(`Read timeout: No data received on socket for ${READ_TIMEOUT} ms`),
          )
        })
      }
      response.pipe(createWriteStream(filepath))
      return true
    } catch (err) {
      error = err
      if (err.response && err.response.statusCode && err.response.statusCode < 500) {
        break
      }

      const retryDelay = exponentialBackoff(retryCount)
      debug(`Error, retrying after ${retryDelay}ms: %s`, err.message)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }
  throw error
}

export default downloadDatasetBackupCommand
