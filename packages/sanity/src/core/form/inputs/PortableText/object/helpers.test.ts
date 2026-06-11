import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {_getModalOption} from './helpers'

const withModal = (modal: unknown): ObjectSchemaType =>
  ({options: {modal}}) as unknown as ObjectSchemaType

describe('_getModalOption', () => {
  it('returns undefined when no modal option is set', () => {
    expect(_getModalOption({} as ObjectSchemaType)).toBeUndefined()
    expect(_getModalOption({options: {}} as unknown as ObjectSchemaType)).toBeUndefined()
  })

  it('returns the default width (1) when modal is set without a width', () => {
    // Regression test for the narrow annotation popover: an unspecified width must
    // resolve to a real container width — previously an empty array bypassed the edit
    // dialog width defaults and collapsed the popover to auto width.
    const result = _getModalOption(withModal({type: 'popover'}))
    expect(result?.type).toBe('popover')
    expect(result?.width).toEqual([1])
  })

  it('returns an undefined width (not an empty array) for an explicit empty width array', () => {
    // An empty responsive array still falls through to the edit dialog width defaults.
    const result = _getModalOption(withModal({type: 'popover', width: []}))
    expect(result?.width).toBeUndefined()
  })

  it('parses an explicit numeric width', () => {
    expect(_getModalOption(withModal({type: 'popover', width: 1}))?.width).toEqual([1])
  })

  it('parses a responsive width array', () => {
    expect(_getModalOption(withModal({type: 'dialog', width: [0, 1, 2]}))?.width).toEqual([0, 1, 2])
  })

  it("parses an 'auto' width", () => {
    expect(_getModalOption(withModal({width: 'auto'}))?.width).toEqual(['auto'])
  })

  it('ignores an invalid modal type', () => {
    expect(_getModalOption(withModal({type: 'sidebar'}))?.type).toBeUndefined()
  })
})
