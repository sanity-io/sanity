import {describe, expect, test} from 'vitest'

import {decideRunMode} from './incremental'
import {type StrykerRunMeta} from './report'

const previousMeta: StrykerRunMeta = {
  target: 'sanity',
  mode: 'full',
  reusedMutants: 0,
  dryRunTests: 396,
  durationMs: 400_000,
  configVersion: 1,
  configHash: 'hash-a',
}

describe('decideRunMode', () => {
  test('reuses a previous run measured with the same pinned config', () => {
    expect(
      decideRunMode({full: false, previousMeta, configVersion: 1, configHash: 'hash-a'}),
    ).toEqual({mode: 'incremental'})
  })

  test('runs in full when a full run is requested', () => {
    expect(
      decideRunMode({full: true, previousMeta, configVersion: 1, configHash: 'hash-a'}),
    ).toEqual({mode: 'full', reason: 'requested'})
  })

  test('runs in full when there is no previous run', () => {
    expect(
      decideRunMode({full: false, previousMeta: undefined, configVersion: 1, configHash: 'hash-a'}),
    ).toEqual({mode: 'full', reason: 'no-previous-run'})
  })

  test('runs in full when the config version moved', () => {
    expect(
      decideRunMode({full: false, previousMeta, configVersion: 2, configHash: 'hash-a'}),
    ).toEqual({mode: 'full', reason: 'config-version-changed'})
  })

  test('runs in full when the config hash moved', () => {
    expect(
      decideRunMode({full: false, previousMeta, configVersion: 1, configHash: 'hash-b'}),
    ).toEqual({mode: 'full', reason: 'config-hash-changed'})
  })
})
