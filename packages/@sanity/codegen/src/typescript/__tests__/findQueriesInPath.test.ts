import assert from 'node:assert'
import {mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {afterAll, beforeAll, describe, expect, suite, test} from 'vitest'

import {type NamedQueryResult} from '../expressionResolvers'
import {findQueriesInPath} from '../findQueriesInPath'

describe('findQueriesInPath', () => {
  test('Can find queries in path', async () => {
    const stream = findQueriesInPath({
      path: path.join('**', 'typescript', '__tests__', 'fixtures', 'source1.ts'),
    })
    const res = []
    for await (const result of stream) {
      res.push(result)
    }
    expect(res.length).toBe(2)
    assert(res[0].type === 'files')
    expect(res[0].fileCount).toBe(1)
    assert(res[1].type == 'queries')
    expect(res[1].queries.length).toBe(1)
    // filename check updated to res[1]
    expect(
      res[1].filename === 'src/typescript/__tests__/fixtures/source1.ts' ||
        res[1].filename === 'packages/@sanity/codegen/src/typescript/__tests__/fixtures/source1.ts',
    ).toBe(true)
    expect(res[1].queries[0].name).toBe('postQuery')
    expect(res[1].queries[0].result).toBe('*[_type == "author"]')
  })
  test('should throw an error if the query name already exists', async () => {
    const stream = findQueriesInPath({
      path: path.join('**', 'fixtures', '{source1,source2}.ts'),
    })
    // Skip files result
    await stream.next()
    // Skip source1.ts result
    await stream.next()
    // Get source2.ts error
    const result = await stream.next()
    if (!result.value) {
      throw new Error('Expected to yield a result')
    }
    expect(result.value.type).toBe('error')
    assert(result.value.type === 'error') // workaround for TS
    expect(result.value.error.message).toMatch(/Duplicate query name found:/)
  })

  test('can find and handle .astro files', async () => {
    const stream = findQueriesInPath({
      path: [path.join('**', 'typescript', '__tests__', 'fixtures', '*.astro')],
    })
    const res = []
    for await (const result of stream) {
      res.push(result)
    }
    expect(res.length).toBe(2)
    assert(res[0].type === 'files')
    expect(res[0].fileCount).toBe(1)
    expect(res[1].type).toBe('queries')
    assert(res[1].type === 'queries') // workaround for TS
    expect(res[1].queries.length).toBe(1)
  })

  // This test is skipped by default because it's very slow, but it's useful to have it around for testing deterministic behavior
  suite.concurrent.skip(
    'deterministic, given the same files',
    async () => {
      const tmpDir = await mkdtemp(path.join(tmpdir(), 'deterministic-'))
      const base: NamedQueryResult[] = []
      beforeAll(async () => {
        // create 10 000 files with the same query, but different variable
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
        const stream = findQueriesInPath({
          path: path.join(tmpDir, '*.ts'),
        })
        for await (const result of stream) {
          if (result.type === 'error') {
            throw new Error(result.error.message)
          }
          if (result.type === 'queries') {
            base.push(...result.queries)
          }
        }
        expect(base.length).toBe(100_000)
      }, 300_000)

      afterAll(async () => {
        // cleanup
        await rm(tmpDir, {recursive: true, force: true})
      })

      for (let i = 0; i < 10; i++) {
        test(`run ${i}`, async () => {
          const compare: NamedQueryResult[] = []
          const stream = findQueriesInPath({
            path: path.join(tmpDir, '*.ts'),
          })
          await writeFile(path.join(tmpDir, `${i}.ts`), `import {defineQuery} from 'groq'\n`)
          await writeFile(
            path.join(tmpDir, `someTestFile.ts`),
            `import {defineQuery} from 'groq'\n`,
          )
          for await (const result of stream) {
            if (result.type === 'error') {
              throw new Error(result.error.message)
            }
            if (result.type === 'queries') {
              compare.push(...result.queries)
            }
          }
          expect(compare).toStrictEqual(base)
        })
      }
    },
    300_000,
  )
})
