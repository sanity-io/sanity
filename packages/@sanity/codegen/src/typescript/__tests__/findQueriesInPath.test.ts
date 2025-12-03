import {mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {afterAll, beforeAll, describe, expect, suite, test} from 'vitest'

import {findQueriesInPath} from '../findQueriesInPath'
import {type ExtractedQuery} from '../types'

// TODO: replace with `Array.fromAsync` once we stop testing with Node 20
// Array.fromAsync is available from Node v22
async function ArrayFromAsync<T>(asyncIterable: AsyncIterable<T>) {
  const values: T[] = []
  for await (const value of asyncIterable) {
    values.push(value)
  }
  return values
}

describe('findQueriesInPath', () => {
  test('Can find queries in path', async () => {
    const {queries} = findQueriesInPath({
      path: path.join('**', 'typescript', '__tests__', 'fixtures', 'source1.ts'),
    })
    const res = await ArrayFromAsync(queries)
    expect(res.length).toBe(1)
    expect(res[0].queries.length).toBe(1)
    // filename can be either of these two
    // depending on whether the test is run from the monorepo root or from the package root
    expect(res[0].filename.endsWith('src/typescript/__tests__/fixtures/source1.ts')).toBe(true)
    expect(res[0].queries[0].variable.id.name).toBe('postQuery')
    expect(res[0].queries[0].query).toBe('*[_type == "author"]')
  })
  test('should return an error if the query name already exists', async () => {
    const {queries} = findQueriesInPath({
      path: path.join('**', 'fixtures', '{source1,source2}.ts'),
    })

    const res = await ArrayFromAsync(queries)
    expect(res.length).toBe(2)
    const [first, second] = res

    expect(first).toMatchObject({
      errors: [],
      filename: expect.stringContaining('src/typescript/__tests__/fixtures/source1.ts'),
      queries: [{variable: {id: {name: 'postQuery'}}}],
    })
    expect(second).toMatchObject({
      errors: [expect.objectContaining({message: expect.stringContaining('Duplicate query name')})],
      filename: expect.stringContaining('src/typescript/__tests__/fixtures/source2.ts'),
      queries: [],
    })
  })

  test('can find and handle .astro files', async () => {
    const {queries} = findQueriesInPath({
      path: [path.join('**', 'typescript', '__tests__', 'fixtures', '*.astro')],
    })
    const res = await ArrayFromAsync(queries)
    expect(res.length).toBe(1)
    expect(res[0].queries.length).toBe(1)
  })
  test('can find and handle .vue files', async () => {
    const {queries} = findQueriesInPath({
      path: [path.join('**', 'typescript', '__tests__', 'fixtures', '*.vue')],
    })
    const res = await ArrayFromAsync(queries)
    expect(res.length).toBe(1)
    expect(res[0].queries.length).toBe(1)
  })

  // This test is skipped by default because it's very slow, but it's useful to have it around for testing deterministic behavior
  suite.concurrent.skip(
    'deterministic, given the same files',
    async () => {
      const tmpDir = await mkdtemp(path.join(tmpdir(), 'deterministic-'))
      const base: ExtractedQuery[] = []
      beforeAll(async () => {
        // create 1 000 files with the same query, but different variable
        for (let i = 0; i < 1_000; i++) {
          const randomFilename = Math.random().toString(36).slice(7)
          await writeFile(
            path.join(tmpDir, `${randomFilename}.ts`),
            `import {defineQuery} from 'groq'\n`,
          )
          for (let n = 0; n < 100; n++) {
            await writeFile(
              path.join(tmpDir, `${randomFilename}.ts`),
              `export const postQuery${i.toString().padStart(4, '0')}${n.toString().padStart(4, '0')} = defineQuery('*[_type == "author"]')\n`,
              {
                flag: 'a',
              },
            )
          }
        }
        // try it 10000 times
        const {queries} = findQueriesInPath({
          path: path.join(tmpDir, '*.ts'),
        })
        for await (const result of queries) {
          if (result.errors.length) {
            const [error] = result.errors
            throw error
          }
          base.push(...result.queries)
        }
        expect(base.length).toBe(100_000)
      }, 300_000)

      afterAll(async () => {
        // cleanup
        await rm(tmpDir, {recursive: true, force: true})
      })

      for (let i = 0; i < 10; i++) {
        test(`run ${i}`, async () => {
          const compare: ExtractedQuery[] = []
          const {queries} = findQueriesInPath({
            path: path.join(tmpDir, '*.ts'),
          })
          await writeFile(path.join(tmpDir, `${i}.ts`), `import {defineQuery} from 'groq'\n`)
          await writeFile(
            path.join(tmpDir, `someTestFile.ts`),
            `import {defineQuery} from 'groq'\n`,
          )
          for await (const result of queries) {
            if (result.errors.length) {
              const [error] = result.errors
              throw error
            }

            compare.push(...result.queries)
          }
          expect(compare).toStrictEqual(base)
        })
      }
    },
    300_000,
  )
})
