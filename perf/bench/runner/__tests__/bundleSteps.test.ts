import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'
import * as zlib from 'node:zlib'

import {afterAll, beforeAll, describe, expect, test} from 'vitest'

import {type BundleStepsReport, formatBundleSteps, measurePaths} from '../bundleSteps'

let distDir: string

beforeAll(() => {
  distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-steps-'))
  fs.mkdirSync(path.join(distDir, 'static'))
  fs.writeFileSync(path.join(distDir, 'static/a.js'), 'export const a = 1\n'.repeat(100))
  fs.writeFileSync(path.join(distDir, 'static/b.js'), 'export const b = 2\n')
})

afterAll(() => {
  fs.rmSync(distDir, {recursive: true, force: true})
})

describe('measurePaths', () => {
  test('sums raw, gzip and brotli sizes of the chunks the dist serves', async () => {
    const a = fs.readFileSync(path.join(distDir, 'static/a.js'))
    const b = fs.readFileSync(path.join(distDir, 'static/b.js'))

    const size = await measurePaths(distDir, ['/static/a.js', '/static/b.js'])

    expect(size).toEqual({
      raw: a.byteLength + b.byteLength,
      gzip: zlib.gzipSync(a).byteLength + zlib.gzipSync(b).byteLength,
      brotli: zlib.brotliCompressSync(a).byteLength + zlib.brotliCompressSync(b).byteLength,
    })
  })
})

const size = (kB: number) => ({raw: kB * 1024, gzip: kB * 512, brotli: kB * 256})

function report(loginKb: number): BundleStepsReport {
  return {
    login: {
      paths: ['/static/a.js'],
      milestonePaths: ['/static/a.js'],
      total: size(loginKb),
      milestone: size(loginKb),
    },
    afterLogin: {
      paths: ['/static/a.js', '/static/b.js'],
      milestonePaths: ['/static/a.js', '/static/b.js'],
      total: size(loginKb + 10),
      milestone: size(loginKb + 10),
      new: size(10),
    },
    authenticated: {
      paths: ['/static/a.js', '/static/b.js'],
      milestonePaths: ['/static/a.js'],
      total: size(loginKb + 10),
      milestone: size(loginKb),
    },
  }
}

describe('formatBundleSteps', () => {
  test('lists every step with its chunk count and sizes', () => {
    expect(formatBundleSteps(report(100))).toMatchInlineSnapshot(`
      "| Step | JS | Chunks | Raw | Gzip | Brotli |
      | :--- | :--- | ---: | ---: | ---: | ---: |
      | 1. Login screen (logged out, cold) | until quiet | 1 | 100.0 kB | 50.0 kB | 25.0 kB |
      | 1. Login screen (logged out, cold) | until milestone | 1 | 100.0 kB | 50.0 kB | 25.0 kB |
      | 2a. Back from login (cache primed by step 1) | until quiet | 2 | 110.0 kB | 55.0 kB | 27.5 kB |
      | 2a. Back from login (cache primed by step 1) | until milestone | 2 | 110.0 kB | 55.0 kB | 27.5 kB |
      | 2a. Back from login (cache primed by step 1) | new downloads | 1 | 10.0 kB | 5.0 kB | 2.5 kB |
      | 2b. Reload with valid auth (cold) | until quiet | 2 | 110.0 kB | 55.0 kB | 27.5 kB |
      | 2b. Reload with valid auth (cold) | until milestone | 1 | 100.0 kB | 50.0 kB | 25.0 kB |"
    `)
  })

  test('compares against a baseline', () => {
    const lines = formatBundleSteps(report(50), report(100)).split('\n')
    expect(lines[2]).toBe(
      '| 1. Login screen (logged out, cold) | until quiet | 1 → 1 | 100.0 kB → 50.0 kB (-50.0%) | 50.0 kB → 25.0 kB (-50.0%) | 25.0 kB → 12.5 kB (-50.0%) |',
    )
    expect(lines[6]).toBe(
      '| 2a. Back from login (cache primed by step 1) | new downloads | 1 → 1 | 10.0 kB → 10.0 kB (0.0%) | 5.0 kB → 5.0 kB (0.0%) | 2.5 kB → 2.5 kB (0.0%) |',
    )
  })
})
