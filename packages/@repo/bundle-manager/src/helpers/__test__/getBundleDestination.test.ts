import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {getBundleDestination} from '../getBundleDestination'

const distDir = path.join('packages', 'sanity', 'dist')

describe('getBundleDestination()', () => {
  it('uploads top-level entries under bare/', () => {
    expect(
      getBundleDestination({
        pkg: 'sanity',
        version: '7.0.0',
        distDir,
        filePath: path.join(distDir, 'structure.mjs'),
      }),
    ).toBe('modules/v1/sanity/7.0.0/bare/structure.mjs')
  })

  it('keeps the directory of nested entries, so they do not overwrite top-level entries', () => {
    const internals = '_dangerously_use_private_internals_that_do_not_follow_semver'
    expect(
      ['structure.mjs', 'structure.mjs.map', '1.mjs'].map((file) =>
        getBundleDestination({
          pkg: 'sanity',
          version: '7.0.0',
          distDir,
          filePath: path.join(distDir, internals, file),
        }),
      ),
    ).toEqual([
      `modules/v1/sanity/7.0.0/bare/${internals}/structure.mjs`,
      `modules/v1/sanity/7.0.0/bare/${internals}/structure.mjs.map`,
      `modules/v1/sanity/7.0.0/bare/${internals}/1.mjs`,
    ])
  })

  it('rewrites scoped package names', () => {
    const visionDist = path.join('packages', '@sanity', 'vision', 'dist')
    expect(
      getBundleDestination({
        pkg: '@sanity/vision',
        version: '7.0.0',
        distDir: visionDist,
        filePath: path.join(visionDist, 'index.mjs'),
      }),
    ).toBe('modules/v1/@sanity__vision/7.0.0/bare/index.mjs')
  })

  it('rejects files outside the dist directory', () => {
    expect(() =>
      getBundleDestination({
        pkg: 'sanity',
        version: '7.0.0',
        distDir,
        filePath: path.join('packages', 'sanity', 'lib', 'index.js'),
      }),
    ).toThrow(/is not inside/)
  })
})
