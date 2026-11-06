import {chromium, devices, firefox, type FullConfig, type FullProject} from '@playwright/test'
import {describe, expect, it} from 'vitest'

import {resolveWarmupTarget} from './globalSetup'

const BASE_URL = 'http://localhost:3339'

function project(name: string, device: (typeof devices)[string]): FullProject {
  return {name, use: {...device, baseURL: `${BASE_URL}/${name}`}} as FullProject
}

// Mirrors playwright.config.ts: Chromium first, Firefox second.
const config = {
  projects: [
    project('chromium', devices['Desktop Chrome']),
    project('firefox', devices['Desktop Firefox']),
  ],
} as FullConfig

function warmupFor(...argv: string[]) {
  const {browserType, baseURL} = resolveWarmupTarget(config, ['node', 'cli.js', 'test', ...argv])
  return {browser: browserType.name(), baseURL}
}

describe('resolveWarmupTarget', () => {
  it('warms up the browser and workspace of the project under test', () => {
    expect(warmupFor('--project', 'firefox')).toEqual({
      browser: 'firefox',
      baseURL: `${BASE_URL}/firefox`,
    })
    expect(warmupFor('--project=firefox')).toEqual({
      browser: 'firefox',
      baseURL: `${BASE_URL}/firefox`,
    })
    expect(warmupFor('--project', 'chromium')).toEqual({
      browser: 'chromium',
      baseURL: `${BASE_URL}/chromium`,
    })
  })

  it('resolves project names the way the Playwright CLI does', () => {
    // Case insensitive, `*` wildcards, and `--project` is variadic.
    expect(warmupFor('--project', 'FireFox').browser).toBe('firefox')
    expect(warmupFor('--project=*fire*').browser).toBe('firefox')
    expect(warmupFor('--project', 'webkit', 'firefox').browser).toBe('firefox')
  })

  it('stops collecting project names at the next flag', () => {
    expect(warmupFor('--project', 'firefox', '--shard', '2/4').browser).toBe('firefox')
    expect(warmupFor('--project=firefox', '--headed').browser).toBe('firefox')
  })

  it('falls back to the first project when no project is selected', () => {
    // Without `--project` Playwright runs every project, starting with this one.
    expect(warmupFor()).toEqual({browser: 'chromium', baseURL: `${BASE_URL}/chromium`})
    expect(warmupFor('--shard', '1/4').browser).toBe('chromium')
    // An unknown name is Playwright's error to report, not global setup's.
    expect(warmupFor('--project', 'nope').browser).toBe('chromium')
  })

  it('returns the browser type itself, not just its name', () => {
    expect(resolveWarmupTarget(config, ['--project=firefox']).browserType).toBe(firefox)
    expect(resolveWarmupTarget(config, []).browserType).toBe(chromium)
  })
})
