import {describe, expect, test} from 'vitest'

import {acquireImmediateValidation, getValidationMode} from './getValidationMode'

describe('getValidationMode', () => {
  test('starts idle and reuses the same subject for a key', () => {
    const key = 'starts-idle'
    const mode = getValidationMode(key)

    expect(mode.getValue()).toBe('idle')
    expect(getValidationMode(key)).toBe(mode)
    expect(getValidationMode('other-key')).not.toBe(mode)
  })

  test('stays immediate until the last retain is released', () => {
    const key = 'shared-immediate'
    const mode = getValidationMode(key)
    const releaseA = acquireImmediateValidation(key)
    const releaseB = acquireImmediateValidation(key)

    expect(mode.getValue()).toBe('immediate')

    releaseA()
    expect(mode.getValue()).toBe('immediate')

    releaseA()
    expect(mode.getValue()).toBe('immediate')

    releaseB()
    expect(mode.getValue()).toBe('idle')
  })

  test('a released key can become immediate again', () => {
    const key = 'reacquire'
    const mode = getValidationMode(key)
    const release = acquireImmediateValidation(key)

    release()
    expect(mode.getValue()).toBe('idle')

    const releaseAgain = acquireImmediateValidation(key)
    expect(mode.getValue()).toBe('immediate')
    releaseAgain()
    expect(mode.getValue()).toBe('idle')
  })
})
