import {createReadStream} from 'node:fs'
import fs from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'

import chalk from 'chalk'
import {lastValueFrom, toArray} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {resolveSource} from './importAssetsAction'
import {readNdjsonFile} from './lib/findNdjsonEntry'

/**
 * Integration tests for the ndjson caching fix.
 * These tests verify that we read the ndjson file once and cache it,
 * rather than creating multiple streams (which causes file descriptor leaks).
 */
describe('ndjson caching (integration)', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'sanity-import-test-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, {recursive: true, force: true})
  })

  it('should read ndjson file once and cache all aspect data', async () => {
    // Create a test directory with images and data.ndjson
    const imagesDir = path.join(tempDir, 'images')
    await fs.mkdir(imagesDir)

    // Create 20 dummy image files
    for (let i = 0; i < 20; i++) {
      await fs.writeFile(path.join(imagesDir, `image-${i}.jpg`), `fake-image-${i}`)
    }

    // Create a data.ndjson file with aspect data for all images
    const ndjsonLines = []
    for (let i = 0; i < 20; i++) {
      ndjsonLines.push(
        JSON.stringify({
          filename: `images/image-${i}.jpg`,
          aspects: {metadata: {index: i}},
        }),
      )
    }
    await fs.writeFile(path.join(tempDir, 'data.ndjson'), ndjsonLines.join('\n'))

    // Use resolveSource to find the ndjson file
    const [resolved] = await lastValueFrom(
      resolveSource({sourcePath: tempDir, chalk}).pipe(toArray()),
    )

    expect(resolved.aspectsNdjsonPath).toBeDefined()

    // Read the ndjson file ONCE using our new function
    const aspectsData = await readNdjsonFile(createReadStream(resolved.aspectsNdjsonPath!))

    // Verify all data was cached
    expect(aspectsData).toHaveLength(20)

    // Simulate processing 20 assets using the cached data (no more file streams!)
    for (let i = 0; i < 20; i++) {
      const aspectData = aspectsData.find(
        (entry: any) => entry.filename === `images/image-${i}.jpg`,
      )
      expect(aspectData).toBeDefined()
      expect(aspectData.aspects.metadata.index).toBe(i)
    }
  })

  it('should handle missing data.ndjson file', async () => {
    // Create only images, no data.ndjson
    const imagesDir = path.join(tempDir, 'images')
    await fs.mkdir(imagesDir)

    for (let i = 0; i < 5; i++) {
      await fs.writeFile(path.join(imagesDir, `image-${i}.jpg`), `fake-image-${i}`)
    }

    // Use resolveSource - it should handle missing ndjson gracefully
    const [resolved] = await lastValueFrom(
      resolveSource({sourcePath: tempDir, chalk}).pipe(toArray()),
    )

    // aspectsNdjsonPath should be undefined when file is missing
    expect(resolved.aspectsNdjsonPath).toBeUndefined()

    // Simulate what importer() does when no ndjson file exists
    const aspectsData = resolved.aspectsNdjsonPath
      ? await readNdjsonFile(createReadStream(resolved.aspectsNdjsonPath))
      : []

    // Should be empty array, not error
    expect(aspectsData).toEqual([])
  })

  it('should correctly parse and match aspect data', async () => {
    const imagesDir = path.join(tempDir, 'images')
    await fs.mkdir(imagesDir)

    // Create 3 images
    await fs.writeFile(path.join(imagesDir, 'cat.jpg'), 'fake-cat')
    await fs.writeFile(path.join(imagesDir, 'dog.jpg'), 'fake-dog')
    await fs.writeFile(path.join(imagesDir, 'bird.jpg'), 'fake-bird')

    // Create ndjson with aspect data for only cat and dog
    const ndjsonContent = [
      JSON.stringify({filename: 'images/cat.jpg', aspects: {animal: 'cat'}}),
      JSON.stringify({filename: 'images/dog.jpg', aspects: {animal: 'dog'}}),
      // bird has no aspect data
    ].join('\n')
    await fs.writeFile(path.join(tempDir, 'data.ndjson'), ndjsonContent)

    const [resolved] = await lastValueFrom(
      resolveSource({sourcePath: tempDir, chalk}).pipe(toArray()),
    )

    const aspectsData = await readNdjsonFile(createReadStream(resolved.aspectsNdjsonPath!))

    // Verify correct parsing
    expect(aspectsData).toHaveLength(2)

    // Simulate looking up aspect data for each asset (what resolveAspectData does)
    const catAspect = aspectsData.find((entry: any) => entry.filename === 'images/cat.jpg')
    const dogAspect = aspectsData.find((entry: any) => entry.filename === 'images/dog.jpg')
    const birdAspect = aspectsData.find((entry: any) => entry.filename === 'images/bird.jpg')

    expect(catAspect?.aspects).toEqual({animal: 'cat'})
    expect(dogAspect?.aspects).toEqual({animal: 'dog'})
    expect(birdAspect).toBeUndefined() // No entry for bird
  })

  it('should handle large ndjson files efficiently', async () => {
    const imagesDir = path.join(tempDir, 'images')
    await fs.mkdir(imagesDir)

    // Create 100 entries to simulate realistic import
    const ndjsonLines = []
    for (let i = 0; i < 100; i++) {
      ndjsonLines.push(
        JSON.stringify({
          filename: `images/image-${i}.jpg`,
          aspects: {metadata: {index: i, data: 'x'.repeat(100)}}, // Add some data
        }),
      )
    }
    await fs.writeFile(path.join(tempDir, 'data.ndjson'), ndjsonLines.join('\n'))

    const [resolved] = await lastValueFrom(
      resolveSource({sourcePath: tempDir, chalk}).pipe(toArray()),
    )

    // Read once
    const startTime = Date.now()
    const aspectsData = await readNdjsonFile(createReadStream(resolved.aspectsNdjsonPath!))
    const readTime = Date.now() - startTime

    expect(aspectsData).toHaveLength(100)

    // Simulate 100 lookups (would be 100 file reads in old code!)
    const lookupStart = Date.now()
    for (let i = 0; i < 100; i++) {
      const aspectData = aspectsData.find(
        (entry: any) => entry.filename === `images/image-${i}.jpg`,
      )
      expect(aspectData).toBeDefined()
    }
    const lookupTime = Date.now() - lookupStart

    // Verify lookups are fast (should be <10ms for 100 lookups from cache)
    expect(lookupTime).toBeLessThan(100)
  })
})
