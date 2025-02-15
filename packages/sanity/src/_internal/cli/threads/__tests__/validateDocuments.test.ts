import {createServer, type Server} from 'node:http'
import path from 'node:path'
import {Worker} from 'node:worker_threads'

import {type SanityDocument} from '@sanity/client'
import {evaluate, parse} from 'groq-js'
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest'

import {getMonorepoAliases} from '../../server/sanityMonorepo'
import {createReceiver, type WorkerChannelReceiver} from '../../util/workerChannels'
import {type ValidateDocumentsWorkerData, type ValidationWorkerChannel} from '../validateDocuments'

async function toArray<T>(asyncIterator: AsyncIterable<T>) {
  const arr: T[] = []
  for await (const i of asyncIterator) arr.push(i)
  return arr
}

const documents: SanityDocument[] = [
  {
    _id: 'valid-author',
    _type: 'author',
    _rev: 'rev1',
    _createdAt: '2024-01-18T19:18:39.048Z',
    _updatedAt: '2024-01-18T19:18:39.048Z',
    name: 'a valid author',
  },
  {
    _id: 'author-no-name',
    _type: 'author',
    _rev: 'rev2',
    _createdAt: '2024-01-18T19:18:39.048Z',
    _updatedAt: '2024-01-18T19:18:39.048Z',
  },
  {
    _id: 'valid-book',
    _type: 'book',
    _rev: 'rev3',
    _createdAt: '2024-01-18T19:18:39.048Z',
    _updatedAt: '2024-01-18T19:18:39.048Z',
    title: 'valid book',
    author: {
      _type: 'reference',
      _ref: 'valid-author',
    },
  },
  {
    _id: 'book-no-title-no-author',
    _type: 'book',
    _rev: 'rev4',
    _createdAt: '2024-01-18T19:18:39.048Z',
    _updatedAt: '2024-01-18T19:18:39.048Z',
  },
  {
    _id: 'book-ref-not-published',
    _type: 'book',
    _createdAt: '2024-01-18T19:18:39.048Z',
    _updatedAt: '2024-01-18T19:18:39.048Z',
    _rev: 'rev5',
    title: 'book with unpublished reference',
    author: {
      _type: 'reference',
      _ref: 'document-does-not-exist',
    },
  },
  {
    _id: 'some-system-document.foo',
    _type: 'system.some-system-document',
    _createdAt: '2024-01-18T19:18:39.048Z',
    _updatedAt: '2024-01-18T19:18:39.048Z',
    _rev: 'rev6',
  },
  {
    _id: 'some-sanity-internal-document.foo',
    _type: 'sanity.some-sanity-internal-document',
    _createdAt: '2024-01-18T19:18:39.048Z',
    _updatedAt: '2024-01-18T19:18:39.048Z',
    _rev: 'rev7',
  },
]

describe('validateDocuments', () => {
  vi.setConfig({testTimeout: 30000})

  let server!: Server
  let receiver!: WorkerChannelReceiver<ValidationWorkerChannel>
  let localhost!: string

  beforeAll(async () => {
    server = createServer(async (req, res) => {
      const {pathname, searchParams} = new URL(req.url!, localhost)
      const [resource, ...rest] = pathname.split('/').slice(2)

      const json = (obj: object) => {
        res.setHeader('Content-Type', 'application/json')
        res.write(JSON.stringify(obj))
        res.statusCode = 200
        res.end()
      }

      const ndjson = (objs: object[]) => {
        for (const obj of objs) {
          res.write(`${JSON.stringify(obj)}\n`)
        }
        res.statusCode = 200
        res.end()
      }

      const getGroqQueryOptions = async () => {
        if (req.method === 'POST') {
          const {query, variables} = JSON.parse(
            (await toArray(req)).map((chunk) => chunk.toString()).join(''),
          )
          return {
            query: query as string,
            params: variables as Record<string, string | string[]>,
          }
        }

        const query = searchParams.get('query')
        if (!query) throw new Error('No query')

        const params = Array.from(searchParams.keys())
          .filter((key) => key.startsWith('$'))
          .reduce<Record<string, string | string[]>>((acc, key) => {
            const values = searchParams.getAll(key)
            acc[key.slice(1)] = values.length === 1 ? values[0] : values
            return acc
          }, {})

        return {query, params}
      }

      switch (resource) {
        case 'data': {
          const [method] = rest
          switch (method) {
            case 'export': {
              ndjson(documents)
              return
            }
            case 'doc': {
              const ids = rest[1].split(',')
              const nonExistentIds = ids.filter((id) => !documents.find((doc) => doc._id === id))

              json({omitted: nonExistentIds.map((id) => ({id, reason: 'existence'}))})
              return
            }
            case 'query': {
              const start = Date.now()
              const {params, query} = await getGroqQueryOptions()

              const tree = parse(query)
              const value = await evaluate(tree, {params, dataset: documents})
              const result = await value.get()

              json({ms: start - Date.now(), query, result})
              return
            }
            default: {
              console.error(`Could not handle request ${req.url}`)
              res.statusCode = 400
              res.end()
              return
            }
          }
        }
        default: {
          console.error(`Could not handle request ${req.url}`)
          res.statusCode = 400
          res.end()
        }
      }
    })

    localhost = await new Promise<string>((resolve, reject) => {
      server?.listen(() => {
        const address = server?.address()
        if (typeof address === 'object' && address) {
          resolve(`http://localhost:${address.port}`)
        } else {
          reject(new Error('Could not get ephemeral port'))
        }
      })
    })

    const workerData: ValidateDocumentsWorkerData = {
      workDir: __dirname,
      clientConfig: {
        apiHost: localhost,
        apiVersion: '1',
        projectId: 'ppsg7ml5',
        dataset: 'test',
        useCdn: true,
        useProjectHostname: false,
      },
      studioHost: localhost,
    }

    const filepath = new URL('../validateDocuments.ts', import.meta.url).pathname

    const worker = new Worker(
      `
        const moduleAlias = require('module-alias')
        const { register } = require('esbuild-register/dist/node')

        moduleAlias.addAliases(${JSON.stringify(await getMonorepoAliases(path.resolve(__dirname, '../../../../../../..')))})

        const { unregister } = register({
          target: 'node18',
          format: 'cjs',
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
          jsx: 'automatic',
        })

        require(${JSON.stringify(filepath)})

      `,
      {eval: true, env: {...process.env, API_HOST: localhost}, workerData},
    )

    receiver = createReceiver<ValidationWorkerChannel>(worker)
  })

  afterAll(async () => {
    await receiver?.dispose()

    await new Promise<void>((resolve, reject) =>
      server?.close((err) => {
        if (err) reject(err)
        else resolve()
      }),
    )
  })

  it('works', async () => {
    expect(await receiver.event.loadedWorkspace()).toMatchObject({
      basePath: '/',
      dataset: 'test',
      name: 'default',
      projectId: 'ppsg7ml5',
    })
    expect(await receiver.event.loadedDocumentCount()).toEqual({documentCount: documents.length})

    let downloadedCount = 0
    for await (const emission of receiver.stream.exportProgress()) {
      downloadedCount++
      expect(emission).toEqual({documentCount: documents.length, downloadedCount})
    }

    expect(await receiver.event.exportFinished()).toEqual({
      totalDocumentsToValidate:
        documents.length -
        documents.filter(
          (doc) => doc._type.startsWith('system.') || doc._type.startsWith('sanity.'),
        ).length,
    })
    await receiver.event.loadedReferenceIntegrity()

    expect(await toArray(receiver.stream.validation())).toMatchObject([
      {
        documentId: 'valid-author',
        documentType: 'author',
        intentUrl: `${localhost}/intent/edit/id=valid-author;type=author`,
        level: 'info',
        markers: [],
        revision: 'rev1',
        validatedCount: 1,
      },
      {
        documentId: 'author-no-name',
        documentType: 'author',
        intentUrl: `${localhost}/intent/edit/id=author-no-name;type=author`,
        level: 'error',
        markers: [{level: 'error', message: 'Required', path: ['name']}],
        revision: 'rev2',
        validatedCount: 2,
      },
      {
        documentId: 'valid-book',
        documentType: 'book',
        intentUrl: `${localhost}/intent/edit/id=valid-book;type=book`,
        level: 'info',
        markers: [],
        revision: 'rev3',
        validatedCount: 3,
      },
      {
        documentId: 'book-no-title-no-author',
        documentType: 'book',
        intentUrl: `${localhost}/intent/edit/id=book-no-title-no-author;type=book`,
        level: 'error',
        markers: [
          {level: 'error', message: 'Required', path: ['title']},
          {level: 'error', message: 'Required', path: ['author']},
        ],
        revision: 'rev4',
        validatedCount: 4,
      },
      {
        documentId: 'book-ref-not-published',
        documentType: 'book',
        intentUrl: `${localhost}/intent/edit/id=book-ref-not-published;type=book`,
        level: 'info',
        markers: [],
        revision: 'rev5',
        validatedCount: 5,
      },
    ])
  })
})
