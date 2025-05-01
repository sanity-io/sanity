import path from 'node:path'

import chalk from 'chalk'
import {lastValueFrom, of, toArray} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {type AssetWithAspects, resolveSource, setAspects} from './importAssetsAction'
import {createMockClient} from './test/createMockClient'

describe('resolveSource', () => {
  it('accepts a directory source', async () => {
    const [result] = await lastValueFrom(
      resolveSource({
        sourcePath: path.resolve(__dirname, 'test/fixtures/test-media-library-directory'),
        chalk,
      }).pipe(toArray()),
    )

    expect(result.aspectsNdjsonPath).toMatch(/data\.ndjson$/)

    expect(result.files).toEqual(['files/4b1cf41766d3671f22f2c614c278f60493e28474.zip'])

    expect(result.images).toEqual([
      'images/2167dbd2135fce8298cc1448eeb512ed60b3224b-5472x3648.jpg',
      'images/a2e6ee830963242992e07afd2773b02a65821939-166x112.jpg',
    ])

    expect(result.workingPath).toMatch(/\/test-media-library-directory$/)
  })

  it('accepts a tar.gz source', async () => {
    const [result] = await lastValueFrom(
      resolveSource({
        sourcePath: path.resolve(__dirname, 'test/fixtures/test-media-library-archive.tar.gz'),
        chalk,
      }).pipe(toArray()),
    )

    expect(result.aspectsNdjsonPath).toMatch(/data\.ndjson$/)

    expect(result.files).toEqual(['files/4b1cf41766d3671f22f2c614c278f60493e28474.zip'])

    expect(result.images).toEqual([
      'images/2167dbd2135fce8298cc1448eeb512ed60b3224b-5472x3648.jpg',
      'images/a2e6ee830963242992e07afd2773b02a65821939-166x112.jpg',
    ])

    expect(result.workingPath).toMatch(/\/test-media-library-export/)
  })
})

describe('setAspects', () => {
  it('performs no mutations if there are no aspects to import', async () => {
    const {client, transactions} = createMockClient()

    await lastValueFrom(
      of<AssetWithAspects>({
        assetIds: ['a', 'drafts.a'],
        originalFilename: 'a.jpg',
        sha1Hash: 'hash',
        isExistingAsset: false,
        aspects: undefined,
      }).pipe(
        setAspects({
          client,
          replaceAspects: false,
        }),
      ),
    )

    expect(transactions).toEqual({})
  })

  it('always sets aspects for newly created assets', async () => {
    const {client, transactions} = createMockClient()

    await lastValueFrom(
      of<AssetWithAspects>({
        assetIds: ['a', 'drafts.a'],
        originalFilename: 'a.jpg',
        sha1Hash: 'hash',
        isExistingAsset: false,
        aspects: {
          metadata: {
            artist: 'Lorde',
          },
        },
      }).pipe(
        setAspects({
          client,
          replaceAspects: false,
        }),
      ),
    )

    const transactionIds = Object.keys(transactions)

    expect(transactionIds.length).toEqual(1)

    expect(Object.values(transactions)[0]).toMatchInlineSnapshot(`
      [
        {
          "documentId": "a",
          "operation": {
            "set": {
              "aspects": {
                "metadata": {
                  "artist": "Lorde",
                },
              },
            },
          },
        },
        {
          "documentId": "drafts.a",
          "operation": {
            "set": {
              "aspects": {
                "metadata": {
                  "artist": "Lorde",
                },
              },
            },
          },
        },
      ]
    `)
  })

  it('performs no mutations for existing assets if `replaceAspects` is not `true`', async () => {
    const {client, transactions} = createMockClient()

    await lastValueFrom(
      of<AssetWithAspects>({
        assetIds: ['a', 'drafts.a'],
        originalFilename: 'a.jpg',
        sha1Hash: 'hash',
        isExistingAsset: true,
        aspects: {
          metadata: {
            artist: 'Lorde',
          },
        },
      }).pipe(
        setAspects({
          client,
          replaceAspects: false,
        }),
      ),
    )

    expect(transactions).toEqual({})
  })

  it('sets aspects for existing assets if `replaceAspects` is `true`', async () => {
    const {client, transactions} = createMockClient()

    await lastValueFrom(
      of<AssetWithAspects>({
        assetIds: ['a', 'drafts.a'],
        originalFilename: 'a.jpg',
        sha1Hash: 'hash',
        isExistingAsset: true,
        aspects: {
          metadata: {
            artist: 'Lorde',
          },
        },
      }).pipe(
        setAspects({
          client,
          replaceAspects: true,
        }),
      ),
    )

    const transactionIds = Object.keys(transactions)

    expect(transactionIds.length).toEqual(1)

    expect(Object.values(transactions)[0]).toMatchInlineSnapshot(`
      [
        {
          "documentId": "a",
          "operation": {
            "set": {
              "aspects": {
                "metadata": {
                  "artist": "Lorde",
                },
              },
            },
          },
        },
        {
          "documentId": "drafts.a",
          "operation": {
            "set": {
              "aspects": {
                "metadata": {
                  "artist": "Lorde",
                },
              },
            },
          },
        },
      ]
    `)
  })
})
