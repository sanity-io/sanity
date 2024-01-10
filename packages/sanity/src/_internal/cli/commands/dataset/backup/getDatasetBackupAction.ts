import {Chalk} from 'chalk'
import {debug} from 'console'
import {PathLike, createWriteStream, existsSync, mkdirSync} from 'fs'
import {tmpdir} from 'os'
import pMap from 'p-map'
import path from 'path'
import pluralize from 'pluralize-esm'
import rimraf from 'rimraf'

import type {CliCommandAction, CliOutputter, CliPrompter, SanityClient} from '@sanity/cli'
import {QueryParams} from '@sanity/client'
import {promptForDatasetName} from '../../../actions/dataset/datasetNamePrompt'

const archiver = require('archiver')
const {getIt} = require('get-it')
const {keepAlive, promise} = require('get-it/middleware')

const CONNECTION_TIMEOUT = 15 * 1000 // 15 seconds
const READ_TIMEOUT = 3 * 60 * 1000 // 3 minutes
const MAX_RETRIES = 5
const DOWNLOAD_CONCURRENCY = 10

const request = getIt([keepAlive(), promise({onlyBody: true})])
const socketsWithTimeout = new WeakSet()
const exponentialBackoff = (retryCount: number) => Math.pow(2, retryCount) * 200

type file = {
  name: string
  url: string
}

type downloadResponse = {
  createdAt: string
  totalSize: number
  files: file[]
  nextCursor?: string
}

const returnDownload = (cursor: string | null): downloadResponse => {
  const responses = [
    {
      createdAt: '2023-01-01',
      totalSize: 100,
      files: [
        {
          name: 'apple.jpg',
          url: 'https://github.com/rneatherway/sturdy-computing-machine/releases/download/sdfsdf/Red_Apple.jpg',
        },
      ],
      nextCursor: 'foo',
    },
    {
      createdAt: '2023-01-01',
      totalSize: 100,
      files: [
        {
          name: 'eg.json',
          url: 'https://github.com/rneatherway/sturdy-computing-machine/releases/download/sdfsdf/eg.json',
        },
      ],
    },
  ]

  if (cursor === 'foo') {
    return responses[1]
  }
  return responses[0]
}

export const getDatasetBackupAction: CliCommandAction = async (args, context) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_cmdName, dataset] = args.argsWithoutOptions
  const flags = args.extOptions
  const {apiClient, output, prompt, chalk} = context
  let client = apiClient()

  const backupId = await (flags.from || promptForBackupId(prompt))
  const datasetName = await (dataset || promptForDatasetName(prompt))
  const prefix = `${datasetName}-backup-${backupId}`
  const outputFile = flags.to || path.join(__dirname, prefix)

  const tmpDir = path.join(tmpdir(), prefix)
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir)
  }

  output.print(chalk.cyan(`Downloading backup ${backupId} to ${outputFile}`))

  debug(`Temporarily outputting files to '${tmpDir}\n'`)
  client = client.clone().config({dataset: datasetName})
  await downloadFiles(output, chalk, client, tmpDir)
  output.print(chalk.cyan(`All files downloaded\n`))

  const archive = archiver('tar', {gzip: true})
  archive.on('error', (err: Error) => {
    throw err
  })

  const archiveDestination = createWriteStream(outputFile as PathLike)
  archiveDestination.on('error', (err: Error) => {
    throw err
  })

  archiveDestination.on('close', () => {
    debug(`Cleaning up temporary files in ${tmpDir}`)
    rimraf(tmpDir, (err) => {
      if (err) {
        debug(`Error cleaning up temporary files: ${err.message}`)
      }
    })
  })

  archive.pipe(archiveDestination)

  debug('Beginning archive...')
  // We intentionally download all files first, then bundle them into the archive. This lets us
  // download multiple files concurrently. A possible optimisation is to stream files into the
  // archive as soon as they've downloaded.
  archive.directory(tmpDir, false)
  archive.finalize()
  debug('Archive complete!')

  output.print(chalk.cyan(`Backup written to ${outputFile}`))
}

async function downloadFiles(
  output: CliOutputter,
  chalk: Chalk,
  client: SanityClient,
  dir: string,
) {
  output.print(chalk.cyan(`Downloading backup contents in batches...`))

  let cursor: string | null = ''
  while (cursor !== null) {
    const query: QueryParams = cursor === '' ? {} : {nextCursor: cursor}
    let response: downloadResponse = {
      createdAt: '',
      totalSize: 0,
      files: [],
    }

    try {
      // TODO: Plug in Backups api path.
      // response = await client.request({
      //   uri: `/datasets/${datasetName}/backups/${backupId}`,
      //   query,
      // })
      response = returnDownload(cursor)
    } catch (error) {
      const msg = error.statusCode ? error.response.body.message : error.message
      output.print(`${chalk.red(`Downloading dataset backup failed: ${msg}`)}\n`)
    }

    const {nextCursor, files} = response
    if (!files || files.length === 0) {
      throw new Error('No files to download')
    }

    const mapper = async (f: file) => {
      await downloadFile(f, dir)
    }
    await pMap(files, mapper, {concurrency: DOWNLOAD_CONCURRENCY})
    debug(`Downloaded ${files.length} ${pluralize('file', files.length)}`)

    cursor = nextCursor || null
    if (cursor) {
      debug('Fetching next batch...\n')
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

const promptForBackupId = (prompt: CliPrompter) => {
  return prompt.single({
    type: 'input',
    message: 'Backup ID:',
    validate: (id) => {
      if (typeof id !== 'string') {
        return 'Backup ID must be a string'
      }

      return true
    },
    default: '',
  })
}
